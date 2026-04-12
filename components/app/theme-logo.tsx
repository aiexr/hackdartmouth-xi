"use client";

type ThemeLogoProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  lightSrc?: string;
  darkSrc?: string;
};

export function ThemeLogo({
  lightSrc = "/logo.svg",
  darkSrc = "/logo-dark.svg",
  ...imgProps
}: ThemeLogoProps) {
  const {
    className,
    alt = "",
    id,
    onLoad,
    onError,
    ...sharedImgProps
  } = imgProps;

  const lightClassName = className
    ? `theme-logo-light ${className}`
    : "theme-logo-light";
  const darkClassName = className
    ? `theme-logo-dark ${className}`
    : "theme-logo-dark";

  return (
    <>
      <img
        src={lightSrc}
        alt={alt}
        className={lightClassName}
        id={id}
        onLoad={onLoad}
        onError={onError}
        {...sharedImgProps}
      />
      <img
        src={darkSrc}
        alt=""
        aria-hidden="true"
        className={darkClassName}
        {...sharedImgProps}
      />
    </>
  );
}
