import React, { useState, useEffect } from 'react';
import { MantineProvider, AppShell, Header, Text, Container, Group, Button, Card, SimpleGrid, Badge, Title, Space } from '@mantine/core';

function App() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        // Usar a variável de ambiente para a URL da API
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/api/features`);
        
        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const data = await response.json();
        setFeatures(data.features);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <AppShell
        padding="md"
        header={
          <Header height={60} p="xs">
            <Group position="apart">
              <Text size="xl" weight={700}>HOPE Platform</Text>
              <Group>
                <Button variant="subtle">Documentação</Button>
                <Button variant="filled" color="blue">Login</Button>
              </Group>
            </Group>
          </Header>
        }
      >
        <Container size="lg">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Title order={1}>Human-Oriented Platform for Enterprises</Title>
            <Text size="lg" color="dimmed" mt="md">
              Transforme sua operação com automação inteligente e integração perfeita entre sistemas
            </Text>
          </div>

          <Space h="xl" />

          {loading ? (
            <Text>Carregando recursos...</Text>
          ) : error ? (
            <Text color="red">Erro ao carregar dados: {error}</Text>
          ) : (
            <SimpleGrid cols={2} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
              {features.map((feature) => (
                <Card key={feature.id} shadow="sm" p="lg" radius="md" withBorder>
                  <Group position="apart" mb="xs">
                    <Text weight={500}>{feature.name}</Text>
                    <Badge color="blue" variant="light">
                      Novo
                    </Badge>
                  </Group>

                  <Text size="sm" color="dimmed">
                    {feature.description}
                  </Text>

                  <Button variant="light" color="blue" fullWidth mt="md" radius="md">
                    Saiba mais
                  </Button>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Container>
      </AppShell>
    </MantineProvider>
  );
}

export default App;
