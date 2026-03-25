// src/components/ui/Avatar.jsx

import clsx from "clsx";

const getInitials = (name = "") =>
  name
    .trim()
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const Avatar = ({
  name,
  src,
  size = 80,
  className,
}) => {
  const initials = getInitials(name);

  return (
    <div
      className={clsx(
        "rounded-full bg-gray-200 flex items-center justify-center overflow-hidden",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={e => {
            e.currentTarget.src = "";
          }}
        />
      ) : (
        <span className="text-gray-600 font-semibold">
          {initials}
        </span>
      )}
    </div>
  );
};

export default Avatar;
