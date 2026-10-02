import './style.css';
import { BRAND } from './flavors.js';

document.querySelectorAll('[data-brand]').forEach((el) => { el.textContent = BRAND; });
