import { createApp } from '../server/app';
import { readConfig } from '../server/llm';

export default createApp(readConfig());
