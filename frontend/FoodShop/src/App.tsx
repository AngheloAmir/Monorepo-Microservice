import { useState } from 'react';
import { Theme, Container, Text } from '@radix-ui/themes';
import { Header, Card, Button } from '@monorepo/components';
import config from '@monorepo/config';

function App() {
  const [appearance] = useState<'light' | 'dark'>('dark');

  return (
    <Theme appearance={appearance} accentColor="indigo" grayColor="slate">
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#111827' }}>
        <Header title="FoodShop Client">
            <Button variant="secondary" onClick={() => alert('Login clicked')}>Login</Button>
        </Header>
        
        <main className="p-8">
            <Container>
                <div className="grid gap-4">
                    <Card title="Featured Products">
                        <Text as="p" className="mb-4">Check out our latest food items.</Text>
                        <Button onClick={() => alert('Browsing...')}>Browse Menu</Button>
                    </Card>

                    <Card title="Shared UI Library">
                        <Text as="p">
                            This application is now consuming components from <code>packages/ui</code> (aliased as shared/components).

                            { config.test }
                        </Text>
                    </Card>
                </div>
            </Container>
        </main>
      </div>
    </Theme>
  );
}

export default App;
