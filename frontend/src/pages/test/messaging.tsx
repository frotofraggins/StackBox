import React, { useState } from 'react';
import ChatWindow from '../../components/messaging/ChatWindow';

const mockMessages = [
  {
    messageId: 'msg1',
    channelId: 'demo-channel',
    userId: 'john.doe',
    content: 'Welcome to the new StackPro messaging system! 🎉',
    messageType: 'text' as const,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    reactions: { '👍': ['jane.smith'], '🎉': ['mike.wilson', 'sarah.jones'] },
    edited: false,
    deleted: false
  },
  {
    messageId: 'msg2',
    channelId: 'demo-channel',
    userId: 'jane.smith',
    content: 'This glassmorphism design looks absolutely stunning! The animations are so smooth.',
    messageType: 'text' as const,
    timestamp: new Date(Date.now() - 3500000).toISOString(),
    reactions: { '❤️': ['john.doe', 'mike.wilson'] },
    edited: false,
    deleted: false
  },
  {
    messageId: 'msg3',
    channelId: 'demo-channel',
    userId: 'mike.wilson',
    content: 'I love how each industry gets its own themed colors. The law firm gold theme is particularly elegant.',
    messageType: 'text' as const,
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    reactions: { '✨': ['john.doe'] },
    edited: false,
    deleted: false
  },
  {
    messageId: 'msg4',
    channelId: 'demo-channel',
    userId: 'sarah.jones',
    content: 'The file sharing capabilities are perfect for our client collaboration needs.',
    messageType: 'file' as const,
    timestamp: new Date(Date.now() - 2500000).toISOString(),
    attachments: [
      { name: 'client-proposal.pdf', size: 2485760, type: 'application/pdf' }
    ],
    reactions: {},
    edited: false,
    deleted: false
  },
  {
    messageId: 'msg5',
    channelId: 'demo-channel',
    userId: 'alex.chen',
    content: 'Real-time typing indicators and presence status make collaboration feel seamless. This is enterprise-grade quality! 💼',
    messageType: 'text' as const,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    reactions: { '💼': ['john.doe', 'jane.smith'] },
    edited: false,
    deleted: false
  },
  {
    messageId: 'msg6',
    channelId: 'demo-channel',
    userId: 'demo-user',
    content: 'This is your message - try typing below to see the interface in action!',
    messageType: 'text' as const,
    timestamp: new Date().toISOString(),
    reactions: {},
    edited: false,
    deleted: false
  }
];

const industries = [
  { id: 'law', name: 'Law Firm', description: 'Elegant gold theme with serif typography' },
  { id: 'realestate', name: 'Real Estate', description: 'Professional green with clean sans-serif' },
  { id: 'healthcare', name: 'Healthcare', description: 'Trustworthy blue with modern fonts' },
  { id: 'tech', name: 'Tech Startup', description: 'Innovative purple with monospace accents' },
  { id: 'finance', name: 'Financial Services', description: 'Sophisticated emerald with corporate styling' }
];

export default function MessagingTest() {
  const [selectedIndustry, setSelectedIndustry] = useState<'law' | 'realestate' | 'healthcare' | 'tech' | 'finance'>('tech');
  const [messages, setMessages] = useState(mockMessages);

  // Mock WebSocket and API calls for demo
  React.useEffect(() => {
    // Override WebSocket for demo
    (global as any).WebSocket = class MockWebSocket {
      url: string;
      readyState: number = 1; // OPEN
      
      constructor(url: string) {
        this.url = url;
        setTimeout(() => {
          this.onopen?.({ type: 'open' } as Event);
        }, 100);
      }
      
      send(data: string) {
        console.log('Mock WebSocket send:', JSON.parse(data));
        // Simulate message echo
        setTimeout(() => {
          this.onmessage?.({
            data: JSON.stringify({
              type: 'message',
              message: {
                messageId: 'demo-' + Date.now(),
                channelId: 'demo-channel',
                userId: 'demo-user',
                content: 'Message sent via demo WebSocket',
                messageType: 'text',
                timestamp: new Date().toISOString(),
                reactions: {},
                edited: false,
                deleted: false
              }
            })
          } as MessageEvent);
        }, 200);
      }
      
      close() {
        this.readyState = 3; // CLOSED
      }
      
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;
    };

    // Mock fetch for demo
    const originalFetch = global.fetch;
    global.fetch = async (url: string | URL | Request, options?: RequestInit) => {
      const urlString = url.toString();
      
      if (urlString.includes('/api/messaging/channels/demo-channel/messages')) {
        if (options?.method === 'GET') {
          return new Response(JSON.stringify({
            success: true,
            messages: mockMessages
          }), { status: 200 });
        } else if (options?.method === 'POST') {
          const body = JSON.parse(options.body as string);
          const newMessage = {
            messageId: 'demo-' + Date.now(),
            channelId: 'demo-channel',
            userId: 'demo-user',
            content: body.content,
            messageType: body.type || 'text',
            timestamp: new Date().toISOString(),
            reactions: {},
            attachments: body.attachments || [],
            edited: false,
            deleted: false
          };
          setMessages(prev => [...prev, newMessage]);
          return new Response(JSON.stringify({
            success: true,
            message: newMessage
          }), { status: 201 });
        }
      }
      
      if (urlString.includes('/api/messaging/messages/') && urlString.includes('/reactions')) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      
      return originalFetch(url, options);
    };

    return () => {
      global.fetch = originalFetch;
    };
  }, []);

  return (
    <div 
      className="min-h-screen p-8"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            StackPro Messaging System Demo
          </h1>
          <p className="text-white/80 text-lg mb-6">
            Experience the glassmorphism interface with industry-specific theming
          </p>
          
          {/* Industry Theme Selector */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id as any)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedIndustry === industry.id
                    ? 'bg-white/20 text-white border-2 border-white/40'
                    : 'bg-white/10 text-white/70 border-2 border-white/20 hover:bg-white/15'
                }`}
                style={{
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="text-sm font-bold">{industry.name}</div>
                <div className="text-xs opacity-80">{industry.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Chat Window */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 rounded-3xl p-8 mb-8" style={{ backdropFilter: 'blur(20px)' }}>
            <div className="h-96 mb-4">
              <ChatWindow
                channelId="demo-channel"
                userId="demo-user"
                clientId="demo-client"
                industry={selectedIndustry}
                className="h-full"
              />
            </div>
            
            <div className="text-center text-white/70 text-sm">
              <p className="mb-2">✨ This is a live demo of the messaging interface</p>
              <p>• Type messages to see real-time updates</p>
              <p>• Click reaction buttons to test interactions</p>
              <p>• Try uploading files to see attachment previews</p>
              <p>• Switch industry themes to see different styling</p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              className="bg-white/10 rounded-2xl p-6 text-white"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="text-2xl mb-3">🔮</div>
              <h3 className="font-bold text-lg mb-2">Glassmorphism Design</h3>
              <p className="text-sm text-white/80">
                Premium frosted glass effects with layered transparency and subtle shadows
              </p>
            </div>

            <div 
              className="bg-white/10 rounded-2xl p-6 text-white"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="text-2xl mb-3">🎭</div>
              <h3 className="font-bold text-lg mb-2">Industry Theming</h3>
              <p className="text-sm text-white/80">
                Custom color schemes and typography for law, healthcare, tech, and more
              </p>
            </div>

            <div 
              className="bg-white/10 rounded-2xl p-6 text-white"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-bold text-lg mb-2">Framer Motion</h3>
              <p className="text-sm text-white/80">
                Smooth animations and micro-interactions throughout the interface
              </p>
            </div>

            <div 
              className="bg-white/10 rounded-2xl p-6 text-white"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="text-2xl mb-3">🔒</div>
              <h3 className="font-bold text-lg mb-2">Enterprise Security</h3>
              <p className="text-sm text-white/80">
                Complete client isolation with AWS-native infrastructure
              </p>
            </div>

            <div 
              className="bg-white/10 rounded-2xl p-6 text-white"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="text-2xl mb-3">🚀</div>
              <h3 className="font-bold text-lg mb-2">Real-time Updates</h3>
              <p className="text-sm text-white/80">
                WebSocket-powered live messaging with typing indicators
              </p>
            </div>

            <div 
              className="bg-white/10 rounded-2xl p-6 text-white"
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="text-2xl mb-3">📱</div>
              <h3 className="font-bold text-lg mb-2">Multi-platform</h3>
              <p className="text-sm text-white/80">
                Responsive design with mobile-first approach and PWA support
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
