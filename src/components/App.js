import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';
import CharacterList from './CharacterList';
import { LanguageProvider } from './context/LanguageContext';


const client = new ApolloClient({
  uri: 'https://rickandmortyapi.com/graphql',
  cache: new InMemoryCache(),
});

function App() {

  return (
    <div className="App">
    <ApolloProvider client={client}>
  <LanguageProvider> <CharacterList/></LanguageProvider>
    </ApolloProvider>
    
    </div>
  );
}

export default App;
