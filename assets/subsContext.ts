import React from 'react';
/** 是否开启旁白字幕。开启时画面自身的注解/角标要给底部字幕让位（见 references/subtitles.md）。 */
export const SubsContext = React.createContext(false);
export const useSubs = () => React.useContext(SubsContext);
