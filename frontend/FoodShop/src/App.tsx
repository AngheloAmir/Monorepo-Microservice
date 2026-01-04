import { useState, useEffect } from 'react';
import { Theme, Button, Container, Flex, Text, Heading, Card, IconButton } from '@radix-ui/themes';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';

function App() {
  const [appearance, setAppearance] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    const newAppearance = appearance === 'light' ? 'dark' : 'light';
    setAppearance(newAppearance);
  };

  useEffect(() => {
    if (appearance === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appearance]);

  return (
    <Theme appearance={appearance} accentColor="indigo" grayColor="slate" radius="medium" scaling="100%">
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors duration-300">
        
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-slate-800 p-4 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
          <Flex justify="between" align="center" className="max-w-5xl mx-auto w-full">
            <Flex align="center" gap="2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <Text weight="bold" size="4" className="text-slate-900 dark:text-white">
                Vite Template
              </Text>
            </Flex>

            <IconButton variant="soft" color="gray" onClick={toggleTheme} highContrast>
              {appearance === 'light' ? <MoonIcon width="18" height="18" /> : <SunIcon width="18" height="18" />}
            </IconButton>
          </Flex>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <Container size="2">
            <Flex direction="column" gap="6" align="center" className="text-center">
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <Card size="4" style={{ position: 'relative', overflow: 'hidden' }}>
                    <Flex direction="column" gap="4" align="center" p="6">
                        <Heading size="8" align="center" className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 font-extrabold pb-2">
                          Jan 2026 Version
                        </Heading>
                        <Text size="5" color="gray" className="max-w-md mx-auto leading-relaxed">
                          This is a Vite Template (Jan 2026 version) with Typescript, TailwindCSS and Radix UI.
                        </Text>
                        
                        asdasdasd
                        ad
                        asdasdasd
                        asd
                        Hello Master
                        <Flex gap="3" mt="4">
                             <Button size="3" variant="solid" color="indigo" highContrast>
                                Get Started
                             </Button>
                             <Button size="3" variant="soft" color="gray">
                                Documentation
                             </Button>
                        </Flex>
                    </Flex>
                </Card>
              </div>

            </Flex>
          </Container>
        </main>

      </div>
    </Theme>
  );
}

export default App;
