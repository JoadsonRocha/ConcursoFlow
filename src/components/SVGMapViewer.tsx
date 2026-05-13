import { useMemo } from 'react';

interface SVGMapViewerProps {
  svgData: string[];
}

export default function SVGMapViewer({ svgData = [] }: SVGMapViewerProps) {
  return (
    <div className="flex flex-col gap-8 p-8 items-center w-full h-full overflow-y-auto bg-slate-100">
      {svgData.map((svg, index) => (
        <div key={index} className="bg-white rounded-none shadow-xl w-full max-w-3xl shrink-0 aspect-[1/1.414] flex items-center justify-center transform transition-all duration-300">
          <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      ))}
    </div>
  );
}
