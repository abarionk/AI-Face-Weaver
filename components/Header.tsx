
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-8">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-400 mb-2">
        AI Face Weaver
      </h1>
      <p className="text-lg text-gray-400">
        Generate a unique face, then weave it into any lifestyle scene you can imagine.
      </p>
    </header>
  );
};

export default Header;
