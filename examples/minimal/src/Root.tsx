import React from 'react';
import { Composition } from 'remotion';
import { Demo } from './Demo';
import { TOTAL, FPS } from './timeline';

export const RemotionRoot: React.FC = () => (
  <Composition id="Demo" component={Demo} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080}
    defaultProps={{ vo: true, subs: true, bgm: false }} />
);
