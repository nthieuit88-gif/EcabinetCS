import React from 'react';
import MeetingRoom3D from './MeetingRoom3D';

const HeroVisual: React.FC = () => {
  return (
    <div className="relative w-full h-[400px] md:h-[500px]">
      <MeetingRoom3D />
      
      {/* Optional overlay or decorative elements can go here */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -top-4 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

export default HeroVisual;
