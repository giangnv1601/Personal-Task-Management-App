// Mock cho SVG khi dùng như URL và như ReactComponent (SVGR)
import React from 'react';

export default 'svg-file-stub.svg';
export const ReactComponent = (props) => React.createElement('svg', props);
