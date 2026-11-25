import '@fontsource-variable/figtree';
import '@fontsource-variable/bricolage-grotesque';
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { registrarAtualizacao } from './pwa';

const app = mount(App, { target: document.getElementById('app')! });
registrarAtualizacao();

export default app;
