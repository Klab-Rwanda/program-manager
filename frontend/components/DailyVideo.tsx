"use client";

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
    DailyProvider,
    DailyVideo,
    DailyAudio, // Added missing import
    useParticipantIds,
    useLocalParticipant,
    useScreenShare,
    useDaily,
} from '@daily-co/daily-react';
import { Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare, ScreenShareOff, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Tile Component
const Tile: React.FC<{ sessionId: string; isScreen?: boolean }> = ({ sessionId, isScreen }) => {
    return (
        <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden aspect-video">
            <DailyVideo sessionId={sessionId} type={isScreen ? "screenVideo" : "video"} automirror style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
            <DailyAudio sessionId={sessionId} />
        </div>
    );
};

// CallUI Component
const CallUI = () => {
    const callObject = useDaily();
    const { screenSharer } = useScreenShare();
    const localParticipant = useLocalParticipant();
    const allParticipantIds = useParticipantIds({ filter: 'all', onActiveSpeakerChange: (p) => console.log(p) });

    const handleMicClick = useCallback(() => callObject?.setLocalAudio(!callObject.localAudio()), [callObject]);
    const handleCamClick = useCallback(() => callObject?.setLocalVideo(!callObject.localVideo()), [callObject]);
    const handleScreenShareClick = useCallback(() => {
        screenSharer?.local ? callObject?.stopScreenShare() : callObject?.startScreenShare();
    }, [callObject, screenSharer]);
    const handleLeave = useCallback(() => {
        callObject?.leave();
        toast.info("You have left the meeting.");
    }, [callObject]);

    return (
        <div className="w-full h-full flex flex-col bg-black">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2 overflow-y-auto">
                {screenSharer && <div className="md:col-span-2"><Tile key={screenSharer.session_id} sessionId={screenSharer.session_id} isScreen /></div>}
                {allParticipantIds.map(id => <Tile key={id} sessionId={id} />)}
            </div>
            <div className="flex justify-center items-center gap-4 p-4 bg-gray-900/80">
                <Button onClick={handleMicClick} variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                    {localParticipant?.audio ? <Mic /> : <MicOff className="text-red-500"/>}
                </Button>
                <Button onClick={handleCamClick} variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                    {localParticipant?.video ? <VideoIcon /> : <VideoOff className="text-red-500"/>}
                </Button>
                <Button onClick={handleScreenShareClick} variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                    {screenSharer?.local ? <ScreenShareOff className="text-red-500"/> : <ScreenShare />}
                </Button>
                <Button onClick={handleLeave} variant="destructive" className="rounded-full px-6">
                    <PhoneOff className="mr-2 h-4 w-4"/>Leave
                </Button>
            </div>
        </div>
    );
};

// CallManager Component
const CallManager: React.FC = () => {
    const callObject = useDaily();
    const [callState, setCallState] = useState<string>('idle');
    const [isJoining, setIsJoining] = useState(false);
    
    // Listen for call events to update state
    useEffect(() => {
        if (!callObject) return;

        const handleJoinedMeeting = () => {
            setCallState('joined-meeting');
            setIsJoining(false);
        };

        const handleLeftMeeting = () => {
            setCallState('left-meeting');
            setIsJoining(false);
        };

        const handleError = () => {
            setCallState('error');
            setIsJoining(false);
        };

        // Add event listeners
        callObject.on('joined-meeting', handleJoinedMeeting);
        callObject.on('left-meeting', handleLeftMeeting);
        callObject.on('error', handleError);

        // Cleanup
        return () => {
            callObject.off('joined-meeting', handleJoinedMeeting);
            callObject.off('left-meeting', handleLeftMeeting);
            callObject.off('error', handleError);
        };
    }, [callObject]);
    
    const joinCall = useCallback(() => {
        if (callObject) {
            setIsJoining(true);
            setCallState('joining');
            callObject.join().catch(() => {
                setCallState('error');
                setIsJoining(false);
            });
        }
    }, [callObject]);

    // Show joining state
    if (isJoining || callState === 'joining') {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="mt-4">Joining...</p>
            </div>
        );
    }

    // Show call UI when joined
    if (callState === 'joined-meeting') {
        return <CallUI />;
    }

    // Show error or left meeting state
    if (callState === 'left-meeting' || callState === 'error') {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-800 text-white">
                <h2 className="text-xl mb-4">
                    {callState === 'error' ? 'An error occurred' : 'You have left the meeting.'}
                </h2>
                <Button onClick={joinCall} size="lg">Rejoin Call</Button>
            </div>
        );
    }

    // Default idle state
    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-800 text-white">
            <h2 className="text-xl mb-4">Ready to join the classroom?</h2>
            <Button onClick={joinCall} size="lg">Join Call</Button>
        </div>
    );
}

// Main exported component
export const DailyVideoComponent: React.FC<{ roomUrl: string; displayName: string }> = ({ roomUrl, displayName }) => {
    if (!roomUrl) {
        return <div className="p-4 font-semibold text-red-500">Error: Room URL not provided.</div>;
    }

    if (!displayName) {
        return <div className="p-4 font-semibold text-red-500">Error: Display name not provided.</div>;
    }

    return (
        <DailyProvider
            url={roomUrl}
            userName={displayName}
            dailyConfig={{
                join_async: true,
                startVideoOff: false,
                startAudioOff: false,
                // Add these settings to improve stability
                subscribeToTracksAutomatically: true,
                logLevel: 'warn'
            }}
        >
            <CallManager />
        </DailyProvider>
    );
};