import '@fontsource-variable/figtree';
import '@fontsource-variable/bricolage-grotesque';
import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { registrarAtualizacao } from './pwa';
import { ajustarAlturaDaTela } from './tela';

const app = mount(App, { target: document.getElementById('app')! });
registrarAtualizacao();
ajustarAlturaDaTela();

export default app;
