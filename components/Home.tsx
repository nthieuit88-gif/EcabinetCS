import React, { useState } from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import SocialProof from './SocialProof';
import Footer from './Footer';
import OngoingMeetingBubble from './OngoingMeetingBubble';
import MeetingCalendar from './MeetingCalendar';
import DocumentRepository from './DocumentRepository';
import UserManagement from './UserManagement';
import Timeline from './Timeline';
import Pricing from './Pricing';
import MeetingRoom from './MeetingRoom';
import { getCurrentUnitData, saveCurrentUnitBookings, syncBookingsFromSupabase, getCurrentUnitId } from '../utils/dataManager';
import { supabase } from '../utils/supabaseClient';

const Home: React.FC = () => {
  const [activeMeeting, setActiveMeeting] = useState<{id?: number, title: string, code: string, documents?: any[], attendees?: any[]} | null>(null);

  const handleAddDocument = async (file: File) => {
      if (!activeMeeting || !activeMeeting.id) return;

      try {
          const unitId = getCurrentUnitId();
          const fileExt = file.name.split('.').pop()?.toLowerCase() || 'file';
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `meetings/${activeMeeting.id}/${fileName}`;

          // 1. Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
              .from('documents')
              .upload(filePath, file);

          let fileUrl = '';
          if (!uploadError) {
              const { data: publicUrlData } = supabase.storage
                  .from('documents')
                  .getPublicUrl(filePath);
              fileUrl = publicUrlData.publicUrl;
          } else {
              console.error('Supabase upload failed:', uploadError);
              fileUrl = URL.createObjectURL(file); // Fallback
          }

          // 2. Prepare document metadata
          const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
          const sizeMB = file.size / (1024 * 1024);
          const sizeStr = sizeMB < 1 
              ? `${(file.size / 1024).toFixed(0)} KB` 
              : `${sizeMB.toFixed(1)} MB`;

          const newDoc = {
              name: file.name,
              type: (['pdf', 'doc', 'docx', 'xlsx', 'pptx'].includes(ext) ? ext : 'file') as any,
              size: sizeStr,
              url: fileUrl,
              fromRepo: false
          };

          // 3. Update Supabase Bookings table
          const data = getCurrentUnitData();
          const bookings = data.bookings || [];
          const meeting = bookings.find(b => b.id === activeMeeting.id);

          if (meeting) {
              const updatedDocs = [...(meeting.documents || []), newDoc];
              
              const { error: updateError } = await supabase
                  .from('bookings')
                  .update({ documents: updatedDocs })
                  .eq('id', activeMeeting.id);

              if (updateError) {
                  console.error('Error updating booking documents in Supabase:', updateError);
              }

              // Update local state and sync
              const updatedBookings = bookings.map(b => 
                  b.id === activeMeeting.id ? { ...b, documents: updatedDocs } : b
              );
              saveCurrentUnitBookings(updatedBookings);
              await syncBookingsFromSupabase(unitId);
              
              // Update local state to reflect changes immediately
              setActiveMeeting(prev => prev ? { ...prev, documents: updatedDocs } : null);
          }
      } catch (err) {
          console.error('Failed to add document to meeting:', err);
      }
  };

  const handleAddRepoDocuments = async (docs: any[]) => {
      if (!activeMeeting || !activeMeeting.id) return;
      
      try {
          const unitId = getCurrentUnitId();
          const data = getCurrentUnitData();
          const bookings = data.bookings || [];
          const meeting = bookings.find(b => b.id === activeMeeting.id);

          if (meeting) {
              const newDocs = docs
                  .filter(doc => !meeting.documents.some((d: any) => d.name === doc.name))
                  .map(doc => ({
                      name: doc.name,
                      type: doc.type,
                      size: doc.size,
                      url: doc.url || '',
                      fromRepo: true
                  }));

              if (newDocs.length === 0) return;

              const updatedDocs = [...(meeting.documents || []), ...newDocs];
              
              const { error: updateError } = await supabase
                  .from('bookings')
                  .update({ documents: updatedDocs })
                  .eq('id', activeMeeting.id);

              if (updateError) {
                  console.error('Error updating booking documents from repo in Supabase:', updateError);
              }

              const updatedBookings = bookings.map(b => 
                  b.id === activeMeeting.id ? { ...b, documents: updatedDocs } : b
              );
              
              saveCurrentUnitBookings(updatedBookings);
              await syncBookingsFromSupabase(unitId);
              setActiveMeeting(prev => prev ? { ...prev, documents: updatedDocs } : null);
          }
      } catch (err) {
          console.error('Failed to add repo documents to meeting:', err);
      }
  };

  const handleUpdateDocuments = async (docs: any[]) => {
      if (!activeMeeting || !activeMeeting.id) return;
      
      try {
          const unitId = getCurrentUnitId();
          const data = getCurrentUnitData();
          const bookings = data.bookings || [];
          
          const { error: updateError } = await supabase
              .from('bookings')
              .update({ documents: docs })
              .eq('id', activeMeeting.id);

          if (updateError) {
              console.error('Error updating booking documents in Supabase:', updateError);
          }

          const updatedBookings = bookings.map(b => 
              b.id === activeMeeting.id ? { ...b, documents: docs } : b
          );
          
          saveCurrentUnitBookings(updatedBookings);
          await syncBookingsFromSupabase(unitId);
          setActiveMeeting(prev => prev ? { ...prev, documents: docs } : null);
      } catch (err) {
          console.error('Failed to update documents in meeting:', err);
      }
  };

  if (activeMeeting) {
      return (
          <MeetingRoom 
              meetingTitle={activeMeeting.title} 
              meetingCode={activeMeeting.code} 
              documents={activeMeeting.documents}
              attendees={activeMeeting.attendees}
              onLeave={() => setActiveMeeting(null)} 
              onAddDocument={handleAddDocument}
              onAddRepoDocuments={handleAddRepoDocuments}
              onUpdateDocuments={handleUpdateDocuments}
          />
      );
  }

  return (
    <>
      <Navbar />
      <main className="flex-col flex overflow-hidden">
        <Hero />
        <SocialProof />
        <MeetingCalendar onJoinMeeting={(event) => setActiveMeeting({
            id: event.id,
            title: event.title, 
            code: `MEET-${event.id}`,
            documents: event.documents,
            attendees: event.attendees
        })} />
        <DocumentRepository />
        <UserManagement />
        <Timeline />
        <Pricing />
      </main>
      <Footer />
      <OngoingMeetingBubble onJoinMeeting={(meeting) => setActiveMeeting(meeting)} />
    </>
  );
};

export default Home;
