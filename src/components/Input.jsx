import Select from 'react-select';

const Input = ({ label, type = 'text', options, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>}
      {type === 'select' ? (
        <Select
          options={options}
          className={`shadow appearance-none border rounded w-full text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${className}`}
          {...props}
        />
      ) : type === 'textarea' ? (
        <textarea
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${className}`}
          {...props}
        />
      ) : (
        <input
          type={type}
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${className}`}
          {...props}
        />
      )}
    </div>
  );
};

export default Input;