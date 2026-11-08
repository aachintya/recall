import { createApp } from '../server/app.js';
import { readConfig } from '../server/llm.js';

export default createApp(readConfig());
