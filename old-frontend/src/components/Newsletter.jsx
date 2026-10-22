import { useState } from 'react';

const Newsletter = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Reset form after a delay or just keep submitted state
    setTimeout(() => {
        setSubmitted(false);
        setFormData({ firstName: '', lastName: '', email: '' });
    }, 5000);
  };

  return (
    <section className="py-24 bg-white">
      <div className="container-custom max-w-[800px]">
        <div className="flex flex-col items-center mb-12">
          <span className="text-sm font-didot tracking-[0.3em] uppercase mb-4">YX|RA</span>
          <h2 className="text-4xl font-didot text-center">Join our news letter</h2>
        </div>

        {submitted ? (
          <div className="text-center py-12 animate-in fade-in duration-700">
            <p className="text-xl font-didot text-green-600 mb-2">Thank you for joining!</p>
            <p className="text-gray-500">You've successfully subscribed to our newsletter.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <label htmlFor="firstName" className="text-xl font-didot mb-2">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-4 focus:outline-none focus:border-black transition-colors"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="lastName" className="text-xl font-didot mb-2">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-4 focus:outline-none focus:border-black transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label htmlFor="email" className="text-xl font-didot mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 p-4 focus:outline-none focus:border-black transition-colors"
                required
              />
            </div>

            <div className="flex justify-center mt-12">
              <button
                type="submit"
                className="bg-black text-white px-12 py-4 font-didot text-lg hover:bg-gray-800 transition-all active:scale-[0.98]"
              >
                Join Now
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default Newsletter;
