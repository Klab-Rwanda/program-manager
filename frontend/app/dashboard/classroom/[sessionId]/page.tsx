"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/contexts/RoleContext";
import { toast } from "sonner";
import { QrCode, Camera, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { openQrForSession, markQRAttendance } from "@/lib/services/attendance.service";
import { QrReader } from "react-qr-reader";

interface JitsiMeetWrapperProps {
    sessionId: string;
    user: any;
}

// Alternative approach using direct iframe instead of React SDK
const JitsiMeetWrapper: React.FC<JitsiMeetWrapperProps> = ({ sessionId, user }) => {
    const [isLoading, setIsLoading] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    
    const userName = user?.name || `Guest${Math.floor(Math.random() * 1000)}`;
    const userEmail = user?.email || `guest${Math.floor(Math.random() * 1000)}@temp.com`;
    const roomName = `KlabSession${sessionId}`;
    
    // Build Jitsi URL with all parameters to avoid popups
    const jitsiUrl = `https://meet.jit.si/${roomName}` +
        `#userInfo.displayName="${encodeURIComponent(userName)}"` +
        `&userInfo.email="${encodeURIComponent(userEmail)}"` +
        `&config.prejoinConfig.enabled=false` +
        `&config.requireDisplayName=false` +
        `&config.enableWelcomePage=false` +
        `&config.enableClosePage=false` +
        `&config.enableAuthenticationUI=false` +
        `&config.enableLobby=false` +
        `&config.autoKnockLobby=false` +
        `&config.enableGuestAccess=true` +
        `&config.startWithAudioMuted=true` +
        `&config.startWithVideoMuted=false` +
        `&interfaceConfig.SHOW_JITSI_WATERMARK=false` +
        `&interfaceConfig.AUTHENTICATION_ENABLE=false` +
        `&interfaceConfig.GUEST_PROMOTION_ENABLE=false` +
        `&interfaceConfig.MOBILE_APP_PROMO=false`;

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-white"/>
                <p className="ml-4 text-lg text-white">Loading classroom...</p>
            </div>
        );
    }

    return (
        <iframe
            ref={iframeRef}
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{
                width: '100%',
                height: '100%',
                border: '0',
                backgroundColor: '#000'
            }}
            sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
            onLoad={() => {
                console.log('Jitsi iframe loaded successfully');
                // Post message to iframe to ensure proper configuration
                if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage({
                        type: 'jitsi-config',
                        config: {
                            prejoinConfig: { enabled: false },
                            requireDisplayName: false,
                            enableAuthenticationUI: false
                        }
                    }, '*');
                }
            }}
        />
    );
};

// Alternative React SDK implementation with comprehensive popup blocking
const JitsiReactSDKWrapper: React.FC<JitsiMeetWrapperProps> = ({ sessionId, user }) => {
    // Only import JitsiMeeting when needed to avoid SSR issues
    const [JitsiMeeting, setJitsiMeeting] = useState<any>(null);
    
    useEffect(() => {
        // Dynamic import to avoid SSR issues
        import('@jitsi/react-sdk').then((module) => {
            setJitsiMeeting(() => module.JitsiMeeting);
        }).catch((error) => {
            console.error('Failed to load Jitsi React SDK:', error);
        });
    }, []);

    if (!JitsiMeeting) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-white"/>
                <p className="ml-4 text-lg text-white">Loading Jitsi SDK...</p>
            </div>
        );
    }

    return (
        <JitsiMeeting
            domain="meet.jit.si"
            roomName={`KlabSession${sessionId}`}
            userInfo={{ 
                displayName: user?.name || `Guest${Math.floor(Math.random() * 1000)}`,
                email: user?.email || `guest${Math.floor(Math.random() * 1000)}@temp.com`
            }}
            // JWT token is explicitly null
            jwt={null}
            configOverwrite={{
                // Completely disable prejoin
                prejoinConfig: { 
                    enabled: false,
                    hideDisplayName: true,
                    hideExtraJoinButtons: true
                },
                
                // Authentication settings
                requireDisplayName: false,
                enableWelcomePage: false,
                enableClosePage: false,
                enableAuthenticationUI: false,
                
                // Lobby settings
                enableLobby: false,
                enableLobbyChat: false,
                autoKnockLobby: false,
                
                // Guest settings
                enableGuestAccess: true,
                guestDialOutStatusCode: 0,
                
                // Media settings
                startWithAudioMuted: true,
                startWithVideoMuted: false,
                
                // UI settings
                disableModeratorIndicator: true,
                enableEmailInStats: false,
                
                // Security settings - disable features that might trigger popups
                disableDeepLinking: true,
                disableThirdPartyRequests: true,
                disableProfile: true,
                
                // Conference settings
                defaultRemoteDisplayName: 'Participant',
                subject: `Klab Session ${sessionId}`,
                
                // Disable recording/streaming that might require auth
                fileRecordingsEnabled: false,
                liveStreamingEnabled: false,
                
                // P2P settings
                enableP2P: true,
                p2p: {
                    enabled: true
                },
                
                // Analytics disabled
                analytics: {
                    disabled: true
                },
                
                // Disable features that might show popups
                enableCalendarIntegration: false,
                enableInsecureRoomNameWarning: false,
                enableRemoteMuting: false,
                
                // Auto-join settings
                startAudioOnly: false,
                
                // Override any server authentication
                hosts: {
                    domain: 'meet.jit.si'
                },
                
                // Disable notifications that might trigger popups
                disableJoinLeaveSounds: true,
                enableTalkWhileMuted: false
            }}
            interfaceConfigOverwrite={{
                // Hide authentication UI elements
                AUTHENTICATION_ENABLE: false,
                GUEST_PROMOTION_ENABLE: false,
                
                // Hide branding
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                
                // Hide potentially problematic UI elements
                HIDE_INVITE_MORE_HEADER: true,
                MOBILE_APP_PROMO: false,
                SHOW_CHROME_EXTENSION_BANNER: false,
                
                // Notifications
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                DISABLE_PRESENCE_STATUS: true,
                
                // Toolbar
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'hangup', 'chat',
                    'desktop', 'fullscreen', 'tileview'
                ],
                
                // Remove elements that might trigger auth
                CLOSE_PAGE_GUEST_HINT: false,
                HIDE_DEEP_LINKING_LOGO: true,
                
                // Settings
                SETTINGS_SECTIONS: ['devices', 'language'],
                
                // Override defaults
                DEFAULT_BACKGROUND: '#474747',
                
                // Disable problematic features
                DISABLE_DOMINANT_SPEAKER_INDICATOR: false,
                DISABLE_FOCUS_INDICATOR: false,
                
                // Film strip
                VERTICAL_FILMSTRIP: false,
                
                // Video quality
                VIDEO_QUALITY_LABEL_DISABLED: true
            }}
            onApiReady={(externalApi) => {
                console.log('Jitsi API Ready - configuring to prevent popups');
                
                // Override any authentication requirements
                externalApi.executeCommand('overwriteConfig', {
                    prejoinConfig: { enabled: false },
                    requireDisplayName: false,
                    enableAuthenticationUI: false,
                    enableLobby: false
                });
                
                // Listen for events that might trigger popups
                externalApi.addEventListener('videoConferenceJoined', () => {
                    console.log('Successfully joined without popups');
                });
                
                externalApi.addEventListener('participantJoined', () => {
                    // Ensure no authentication prompts appear
                    externalApi.executeCommand('overwriteConfig', {
                        enableAuthenticationUI: false
                    });
                });
                
                // Block any authentication events
                externalApi.addEventListener('authenticating', () => {
                    console.log('Authentication blocked');
                    return false;
                });
                
                // Handle any popup attempts
                externalApi.addEventListener('toolbarButtonClicked', (event) => {
                    if (event.key === 'authenticate' || event.key === 'login') {
                        event.preventDefault();
                        return false;
                    }
                });
            }}
            getIFrameRef={(iframeRef) => { 
                if (iframeRef) {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                    iframeRef.style.border = '0';
                    
                    // Set iframe attributes to prevent popups
                    iframeRef.setAttribute('allow', 'camera; microphone; display-capture; autoplay');
                    iframeRef.setAttribute('sandbox', 'allow-forms allow-same-origin allow-scripts allow-popups-to-escape-sandbox');
                    
                    // Block authentication-related postMessages
                    const originalPostMessage = iframeRef.contentWindow?.postMessage;
                    if (originalPostMessage) {
                        iframeRef.contentWindow.postMessage = function(message, targetOrigin, transfer) {
                            if (typeof message === 'object' && message.type && 
                                (message.type.includes('auth') || message.type.includes('login'))) {
                                console.log('Blocked authentication message:', message);
                                return;
                            }
                            return originalPostMessage.call(this, message, targetOrigin, transfer);
                        };
                    }
                }
            }}
            containerStyles={{ 
                width: '100%', 
                height: '100%',
                backgroundColor: '#000'
            }}
            spinner={() => (
                <div className="flex h-full w-full items-center justify-center bg-black">
                    <Loader2 className="h-8 w-8 animate-spin text-white"/>
                    <p className="ml-4 text-lg text-white">Joining without authentication...</p>
                </div>
            )}
        />
    );
};

export default function ClassroomPage() {
    const params = useParams();
    const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
    const { user, role, loading: authLoading } = useAuth();

    const [isQrModalOpen, setQrModalOpen] = useState(false);
    const [isScanModalOpen, setScanModalOpen] = useState(false);
    const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [useIframe, setUseIframe] = useState(true); // Toggle between iframe and React SDK

    const handleStartAttendanceCheck = async () => {
        if (!sessionId) return;
        setIsProcessing(true);
        setQrModalOpen(true);
        try {
            const result = await openQrForSession(sessionId);
            setQrCodeImage(result.qrCodeImage);
            toast.success("New QR code generated!");
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to start attendance check.");
            setQrModalOpen(false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleQrScanResult = async (result: any) => {
        if (result && !isProcessing) {
            setIsProcessing(true);
            toast.info("Verifying QR Code...");
            try {
                await markQRAttendance(result.text);
                toast.success("Attendance marked!");
                setScanModalOpen(false);
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Invalid QR Code.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    if (authLoading || !sessionId) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-4 text-lg text-muted-foreground">Loading classroom...</p>
            </div>
        );
    }

    const defaultUser = user || {
        name: `Guest${Math.floor(Math.random() * 1000)}`,
        email: `guest${Math.floor(Math.random() * 1000)}@temp.com`
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-4 p-4">
            <div className="flex-1 h-[60vh] md:h-auto rounded-lg overflow-hidden border">
                {useIframe ? (
                    <JitsiMeetWrapper sessionId={sessionId} user={defaultUser} />
                ) : (
                    <JitsiReactSDKWrapper sessionId={sessionId} user={defaultUser} />
                )}
            </div>

            <Card className="w-full md:w-80 flex-shrink-0">
                <CardHeader><CardTitle>Session Controls</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-blue-50">
                        <h3 className="font-semibold mb-2">Meeting Info</h3>
                        <p className="text-sm text-gray-600">Session: {sessionId}</p>
                        <p className="text-sm text-gray-600">
                            Joined as: {defaultUser.name}
                        </p>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-2"
                            onClick={() => setUseIframe(!useIframe)}
                        >
                            Switch to {useIframe ? 'React SDK' : 'Direct Iframe'}
                        </Button>
                    </div>
                    
                    {role === 'facilitator' && (
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <h3 className="font-semibold mb-2">Facilitator Actions</h3>
                            <Button className="w-full" onClick={handleStartAttendanceCheck} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <QrCode className="mr-2 h-4 w-4" />}
                                Take Attendance
                            </Button>
                        </div>
                    )}
                    {role === 'trainee' && (
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <h3 className="font-semibold mb-2">Trainee Actions</h3>
                            <Button className="w-full" onClick={() => setScanModalOpen(true)}>
                                <Camera className="mr-2 h-4 w-4" />
                                Scan Attendance QR
                            </Button>
                        </div>
                    )}
                    
                    {!role && (
                        <div className="p-4 border rounded-lg bg-green-50">
                            <h3 className="font-semibold mb-2">Guest Access</h3>
                            <p className="text-sm text-gray-600">
                                You've joined as a guest. No popups should appear!
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isQrModalOpen} onOpenChange={setQrModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Share this QR Code</DialogTitle></DialogHeader>
                    <div className="flex justify-center p-4">
                        {isProcessing || !qrCodeImage ? <Loader2 className="h-16 w-16 animate-spin"/> : <img src={qrCodeImage} alt="Session QR Code" className="w-64 h-64" />}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isScanModalOpen} onOpenChange={setScanModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Scan QR Code</DialogTitle></DialogHeader>
                    {isProcessing ? (
                        <div className="p-8 flex justify-center"><Loader2 className="h-10 w-10 animate-spin"/></div>
                    ) : (
                        <div className="relative p-2 border-2 border-dashed rounded-lg">
                            <QrReader onResult={handleQrScanResult} constraints={{ facingMode: 'user' }} containerStyle={{ width: '100%' }} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><ScanLine className="h-48 w-48 text-white/20"/></div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}