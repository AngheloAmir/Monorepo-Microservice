import { useState } from 'react';
import { Theme, Container, Text } from '@radix-ui/themes';
import { Header, Card, Button } from '@monorepo/components';

function App() {
  const [appearance] = useState<'light' | 'dark'>('dark');

  return (
    <Theme appearance={appearance} accentColor="crimson" grayColor="sand">
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#111827' }}>
        <Header title="Admin Dashboard">
            <Button variant="secondary" onClick={() => alert('Settings')}>Settings</Button>
            <Button onClick={() => alert('Logout')}>Logout</Button>
        </Header>
        
        <main className="p-8">
            <Container>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card title="User Stats">
                        <Text as="p" className="text-2xl font-bold">1,234</Text>
                        <Text as="p" color="gray">Active Users</Text>
                    </Card>

                    <Card title="System Status">
                         <div style={{ color: 'green', fontWeight: 'bold' }}>Operational</div>
                         <Text as="p">All systems green.</Text>
                    </Card>
                    
                    <div className="col-span-1 md:col-span-2">
                        <Card title="Shared Components Integration">
                            <Text>
                                This Admin Panel is also using the shared <code>@monorepo/components</code> library.
                                Changes to the library will reflect here immediately after build.
                            </Text>
                        </Card>
                    </div>
                </div>
            </Container>
        </main>
      </div>
    </Theme>
  );
}

export default App;
