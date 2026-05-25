import { useState, type ImgHTMLAttributes } from 'react';

type SmartImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  wrapperClassName?: string;
  eager?: boolean;
};

export default function SmartImage({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  eager = false,
  onLoad,
  onError,
  ...props
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${wrapperClassName}`.trim()}>
      {!loaded && !failed && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100" />}

      {src && !failed ? (
        <img
          {...props}
          src={src}
          alt={alt}
          className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`.trim()}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : 'auto'}
          onLoad={(event) => {
            setLoaded(true);
            onLoad?.(event);
          }}
          onError={(event) => {
            setFailed(true);
            onError?.(event);
          }}
        />
      ) : (
        <div className="flex h-full min-h-[96px] w-full items-center justify-center text-xs font-medium text-slate-400">
          Image unavailable
        </div>
      )}
    </div>
  );
}
