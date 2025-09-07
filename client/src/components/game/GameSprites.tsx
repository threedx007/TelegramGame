// SVG-спрайты для игры "Септик-Серфер"
// Векторная графика с идеальной прозрачностью

export const PlayerSprite = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    {/* Основная капля */}
    <path
      d={`M ${width/2} 5 
          C ${width*0.9} 5 ${width-5} ${height*0.4} ${width-5} ${height*0.7}
          C ${width-5} ${height*0.9} ${width*0.7} ${height-5} ${width/2} ${height-5}
          C ${width*0.3} ${height-5} 5 ${height*0.9} 5 ${height*0.7}
          C 5 ${height*0.4} ${width*0.1} 5 ${width/2} 5 Z`}
      fill="#00A8FF"
      stroke="#003366"
      strokeWidth="2"
    />
    {/* Блики */}
    <ellipse cx={width*0.35} cy={height*0.3} rx={width*0.1} ry={height*0.15} fill="#87CEEB" opacity="0.7"/>
    <ellipse cx={width*0.65} cy={height*0.25} rx={width*0.05} ry={height*0.08} fill="#FFFFFF" opacity="0.9"/>
    {/* Глаза */}
    <circle cx={width*0.35} cy={height*0.55} r={width*0.08} fill="#000000"/>
    <circle cx={width*0.65} cy={height*0.55} r={width*0.08} fill="#000000"/>
    {/* Блики в глазах */}
    <circle cx={width*0.37} cy={height*0.52} r={width*0.03} fill="#FFFFFF"/>
    <circle cx={width*0.67} cy={height*0.52} r={width*0.03} fill="#FFFFFF"/>
    {/* Улыбка */}
    <path
      d={`M ${width*0.3} ${height*0.75} Q ${width*0.5} ${height*0.85} ${width*0.7} ${height*0.75}`}
      stroke="#000000"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    {/* Искорки */}
    <g fill="#FFFFFF" opacity="0.8">
      <polygon points={`${width*0.15},${height*0.2} ${width*0.18},${height*0.25} ${width*0.15},${height*0.3} ${width*0.12},${height*0.25}`}/>
      <polygon points={`${width*0.85},${height*0.15} ${width*0.88},${height*0.2} ${width*0.85},${height*0.25} ${width*0.82},${height*0.2}`}/>
      <polygon points={`${width*0.9},${height*0.6} ${width*0.92},${height*0.63} ${width*0.9},${height*0.66} ${width*0.88},${height*0.63}`}/>
    </g>
  </g>
);

export const BacteriaSprite = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle cx={width/2} cy={height/2} r={width*0.4} fill="#32CD32" stroke="#228B22" strokeWidth="2"/>
    <circle cx={width*0.4} cy={height*0.4} r={width*0.08} fill="#90EE90"/>
    <circle cx={width*0.6} cy={height*0.6} r={width*0.06} fill="#90EE90"/>
    <circle cx={width*0.3} cy={height*0.7} r={width*0.05} fill="#90EE90"/>
  </g>
);

export const BubbleSprite = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle cx={width/2} cy={height/2} r={width*0.4} fill="#FFFFFF" fillOpacity="0.8" stroke="#E0E0E0" strokeWidth="1"/>
    <circle cx={width*0.35} cy={height*0.35} r={width*0.08} fill="#FFFFFF" fillOpacity="0.9"/>
    <circle cx={width*0.7} cy={height*0.3} r={width*0.04} fill="#FFFFFF"/>
  </g>
);

export const FilterSprite = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x={width*0.2} y={width*0.1} width={width*0.6} height={height*0.8} fill="#4169E1" stroke="#191970" strokeWidth="2" rx="4"/>
    <rect x={width*0.25} y={width*0.2} width={width*0.5} height={height*0.15} fill="#87CEEB"/>
    <rect x={width*0.25} y={width*0.4} width={width*0.5} height={height*0.15} fill="#87CEEB"/>
    <rect x={width*0.25} y={width*0.6} width={width*0.5} height={height*0.15} fill="#87CEEB"/>
  </g>
);

export const KeySprite = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle cx={width*0.25} cy={height*0.25} r={width*0.15} fill="#FFD700" stroke="#DAA520" strokeWidth="2"/>
    <circle cx={width*0.25} cy={height*0.25} r={width*0.08} fill="none" stroke="#DAA520" strokeWidth="2"/>
    <rect x={width*0.35} y={height*0.2} width={width*0.5} height={height*0.1} fill="#FFD700" stroke="#DAA520" strokeWidth="1"/>
    <rect x={width*0.75} y={height*0.15} width={width*0.08} height={height*0.08} fill="#FFD700"/>
    <rect x={width*0.75} y={height*0.27} width={width*0.05} height={height*0.06} fill="#FFD700"/>
  </g>
);

export const FatSprite = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <ellipse cx={width/2} cy={height*0.6} rx={width*0.45} ry={height*0.35} fill="#FFD700" stroke="#B8860B" strokeWidth="2"/>
    <ellipse cx={width*0.3} cy={height*0.4} rx={width*0.15} ry={height*0.2} fill="#FFD700"/>
    <ellipse cx={width*0.7} cy={height*0.5} rx={width*0.12} ry={height*0.15} fill="#FFD700"/>
    <circle cx={width*0.4} cy={height*0.7} r={width*0.04} fill="#FFA500" opacity="0.8"/>
    <circle cx={width*0.6} cy={height*0.65} r={width*0.03} fill="#FFA500" opacity="0.8"/>
  </g>
);

export const WasteSprite = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path
      d={`M ${width*0.2} ${height*0.7} 
          L ${width*0.4} ${height*0.2} 
          L ${width*0.6} ${height*0.5} 
          L ${width*0.8} ${height*0.3} 
          L ${width*0.75} ${height*0.8} 
          L ${width*0.25} ${height*0.85} Z`}
      fill="#8B4513"
      stroke="#654321"
      strokeWidth="2"
    />
    <circle cx={width*0.35} cy={height*0.4} r={width*0.06} fill="#A0522D"/>
    <circle cx={width*0.65} cy={height*0.6} r={width*0.05} fill="#A0522D"/>
  </g>
);

export const ChemicalSprite = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path
      d={`M ${width*0.3} ${height*0.2} 
          Q ${width*0.5} ${height*0.1} ${width*0.7} ${height*0.2}
          Q ${width*0.8} ${height*0.5} ${width*0.6} ${height*0.8}
          Q ${width*0.5} ${height*0.9} ${width*0.4} ${height*0.8}
          Q ${width*0.2} ${height*0.5} ${width*0.3} ${height*0.2} Z`}
      fill="#9932CC"
      stroke="#4B0082"
      strokeWidth="2"
    />
    <circle cx={width*0.4} cy={height*0.3} r={width*0.04} fill="#DDA0DD" opacity="0.8"/>
    <circle cx={width*0.6} cy={height*0.4} r={width*0.03} fill="#DDA0DD" opacity="0.8"/>
    <circle cx={width*0.5} cy={height*0.6} r={width*0.05} fill="#DDA0DD" opacity="0.8"/>
  </g>
);

export const IceSprite = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <polygon
      points={`${width*0.5},${height*0.1} ${width*0.7},${height*0.4} ${width*0.9},${height*0.3} ${width*0.8},${height*0.7} ${width*0.5},${height*0.9} ${width*0.2},${height*0.7} ${width*0.1},${height*0.3} ${width*0.3},${height*0.4}`}
      fill="#B0E0E6"
      stroke="#4682B4"
      strokeWidth="2"
    />
    <polygon
      points={`${width*0.5},${height*0.2} ${width*0.6},${height*0.4} ${width*0.5},${height*0.6} ${width*0.4},${height*0.4}`}
      fill="#E0F6FF"
      opacity="0.8"
    />
  </g>
);

export const LightningSprite = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path
      d={`M ${width*0.6} ${height*0.1} 
          L ${width*0.2} ${height*0.4} 
          L ${width*0.45} ${height*0.45} 
          L ${width*0.3} ${height*0.9} 
          L ${width*0.7} ${height*0.55} 
          L ${width*0.45} ${height*0.5} Z`}
      fill="#FFFF00"
      stroke="#FFD700"
      strokeWidth="2"
    />
    <path
      d={`M ${width*0.55} ${height*0.15} 
          L ${width*0.25} ${height*0.42} 
          L ${width*0.4} ${height*0.47} 
          L ${width*0.32} ${height*0.82} 
          L ${width*0.65} ${height*0.57} 
          L ${width*0.5} ${height*0.52} Z`}
      fill="#FFFFFF"
      opacity="0.6"
    />
  </g>
);

export const RootsSprite = ({ x, y, width, height }: { x: number; y: number; width: number; height: number }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path
      d={`M ${width*0.3} ${height*0.1} 
          Q ${width*0.2} ${height*0.3} ${width*0.4} ${height*0.5}
          Q ${width*0.3} ${height*0.7} ${width*0.1} ${height*0.9}`}
      stroke="#8B4513"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d={`M ${width*0.7} ${height*0.1} 
          Q ${width*0.8} ${height*0.3} ${width*0.6} ${height*0.5}
          Q ${width*0.7} ${height*0.7} ${width*0.9} ${height*0.9}`}
      stroke="#8B4513"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d={`M ${width*0.5} ${height*0.2} 
          Q ${width*0.4} ${height*0.4} ${width*0.6} ${height*0.6}
          Q ${width*0.5} ${height*0.8} ${width*0.3} ${height*0.95}`}
      stroke="#A0522D"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  </g>
);