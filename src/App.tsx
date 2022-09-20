import Editor from '@monaco-editor/react';
import React from 'react';

function App() {
  return <Editor height="90vh" defaultLanguage="javascript" defaultValue="// some comment" />;
}

export default App;
