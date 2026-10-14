import { createGame } from './game';
import { mountUI } from './ui';

const root = document.getElementById('app');
if (!root) throw new Error('#app introuvable');
mountUI(root, createGame());
