"use client";

import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Loader2 } from 'lucide-react';

interface JitsiMeetProps {
    roomName: string;
    displayName: string;
    containerStyles?: React.CSSProperties;
}

export const JitsiMeetComponent: React.FC<JitsiMeetProps> = ({ roomName, displayName, containerStyles }) => {
    return (
        <JitsiMeeting
            domain="meet.jit.si" // Use the public Jitsi server
            roomName={roomName}
            userInfo={{
                displayName: displayName
            }}
            configOverwrite={{
                // --- THIS IS THE KEY FIX ---
                // This configuration tells Jitsi not to wait for a moderator.
                // The first person to join effectively starts the meeting for everyone.
                // This is perfect for a classroom scenario where the facilitator joins first.
                'prejoinConfig.prejoinRequired': false,
                'prejoinConfig.hideDisplayName': true,
                startWithAudioMuted: true,
                startWithVideoMuted: false, // Start with video on for a classroom feel
                disableModeratorIndicator: true,
                enableEmailInStats: false,
                // Optional: Add a custom logo
                // brandingLogoUrl: 'URL_TO_YOUR_KLAB_LOGO.png'
            }}
            interfaceConfigOverwrite={{
                // UI tweaks for a cleaner classroom look
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'tileview', 'videobackgroundblur',
                ],
            }}
            getIFrameRef={(iframeRef) => { 
                iframeRef.style.height = '100%';
                iframeRef.style.width = '100%';
                iframeRef.style.border = '0'; // Remove default border
            }}
            containerStyles={{
                width: '100%',
                height: '100%',
                ...containerStyles
            }}
            // A spinner to show while Jitsi is loading
            spinner={() => (
                <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-400"/>
                    <p className="ml-4 text-lg">Joining Classroom...</p>
                </div>
            )}
        />
    );
};