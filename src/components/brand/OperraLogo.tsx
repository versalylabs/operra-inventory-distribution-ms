import React from "react";

export interface OperraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  subtitle?: string | null;
  badge?: string | null;
  inverted?: boolean;
}

export function OperraLogoIcon({
  className = "w-9 h-9",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
    >
      <defs>
        <linearGradient
          id="op-logo-bg"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#15191e" />
          <stop offset="100%" stopColor="#000710" />
        </linearGradient>
        <linearGradient
          id="op-logo-ember"
          x1="16"
          y1="12"
          x2="26"
          y2="26"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ff6b1a" />
          <stop offset="100%" stopColor="#e04e00" />
        </linearGradient>
      </defs>

      {/* Background Squircle */}
      <rect width="32" height="32" rx="7.5" fill="url(#op-logo-bg)" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="7"
        stroke="#ffffff"
        strokeOpacity="0.15"
      />

      {/* Isometric Storage & Supply Chain Facets */}
      {/* Top Face: White Inventory Tier */}
      <path
        d="M16 6.5L24.5 11.2L16 15.9L7.5 11.2Z"
        fill="#FFFFFF"
      />

      {/* Left Face: Steel Mist Warehouse Pallet Tier */}
      <path
        d="M7.5 12.6L15.2 16.8V25.5L7.5 21.2Z"
        fill="#B9BBC6"
      />
      <path
        d="M7.5 16.9L15.2 21.1"
        stroke="#000710"
        strokeWidth="0.8"
        strokeOpacity="0.3"
      />

      {/* Right Face: Active Logistics Dispatch (Brex Ember) */}
      <path
        d="M16.8 16.8L24.5 12.6V21.2L16.8 25.5Z"
        fill="url(#op-logo-ember)"
      />
      <path
        d="M16.8 21.1L24.5 16.9"
        stroke="#ffffff"
        strokeWidth="0.8"
        strokeOpacity="0.4"
      />

      {/* Central Distribution Nexus */}
      <circle cx="16" cy="16.4" r="2.1" fill="#000710" />
      <circle cx="16" cy="16.4" r="1.2" fill="#FF5900" />
    </svg>
  );
}

export function OperraLogo({
  className = "",
  size = "md",
  showWordmark = true,
  subtitle,
  badge,
  inverted = false,
}: OperraLogoProps) {
  const sizeMap = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  const textMap = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <OperraLogoIcon className={sizeMap[size]} />

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-extrabold ${textMap[size]} tracking-compressed-sm ${
                inverted ? "text-white" : "text-[#000000]"
              }`}
            >
              OPERRA
              <span className="text-[#ff5900] ml-0.5">.</span>
            </span>

            {badge && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] bg-[#ff5900]/20 text-[#ff5900] border border-[#ff5900]/30 leading-normal">
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <span
              className={`text-[10px] font-semibold tracking-wider uppercase mt-0.5 ${
                inverted ? "text-[#8b8d98]" : "text-[#60646c]"
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
