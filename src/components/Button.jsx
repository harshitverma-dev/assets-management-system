const Button = ({ children, onClick, className = '', variant = 'primary', ...props }) => {
  const baseClasses = 'font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline';
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-700 text-white',
    danger: 'bg-red-500 hover:bg-red-700 text-white',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;