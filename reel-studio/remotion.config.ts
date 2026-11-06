import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setConcurrency(null);
Config.setCodec('h264');
Config.setCrf(18); // high quality for Instagram re-encoding
