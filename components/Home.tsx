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
import { getCurrentUnitData, saveCurrentUnitBookings } from '../utils/dataManager';

const Home: React.FC = () => {
  const [activeMeeting, setActiveMeeting] = useState<{id?: number, title: string, code: string, documents?: any[]} | null>(null);

  const handleAddDocument = async (file: File) => {
      if (!activeMeeting || !activeMeeting.id) return;

      return new Promise<void>((resolve) => {
          setTimeout(() => {
              const data = getCurrentUnitData();
              const bookings = data.bookings || [];
              const meeting = bookings.find(b => b.id === activeMeeting.id);

              if (meeting) {
                  const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
                  const sizeMB = file.size / (1024 * 1024);
                  const sizeStr = sizeMB < 1 
                      ? `${(file.size / 1024).toFixed(0)} KB` 
                      : `${sizeMB.toFixed(1)} MB`;

                  const newDoc = {
                      name: file.name,
                      type: (['pdf', 'doc', 'docx', 'xlsx', 'pptx'].includes(ext) ? ext : 'file') as any,
                      size: sizeStr,
                      url: URL.createObjectURL(file),
                      fromRepo: false
                  };

                  const updatedDocs = [...(meeting.documents || []), newDoc];
                  const updatedBookings = bookings.map(b => 
                      b.id === activeMeeting.id ? { ...b, documents: updatedDocs } : b
                  );
                  
                  saveCurrentUnitBookings(updatedBookings);
                  
                  // Update local state to reflect changes immediately
                  setActiveMeeting(prev => prev ? { ...prev, documents: updatedDocs } : null);
              }
              resolve();
          }, 1000);
      });
  };

  const handleAddRepoDocuments = async (docs: any[]) => {
      if (!activeMeeting || !activeMeeting.id) return;
      
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
          const updatedBookings = bookings.map(b => 
              b.id === activeMeeting.id ? { ...b, documents: updatedDocs } : b
          );
          
          saveCurrentUnitBookings(updatedBookings);
          setActiveMeeting(prev => prev ? { ...prev, documents: updatedDocs } : null);
      }
  };

  if (activeMeeting) {
      return (
          <MeetingRoom 
              meetingTitle={activeMeeting.title} 
              meetingCode={activeMeeting.code} 
              documents={activeMeeting.documents}
              onLeave={() => setActiveMeeting(null)} 
              onAddDocument={handleAddDocument}
              onAddRepoDocuments={handleAddRepoDocuments}
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
            documents: event.documents
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
