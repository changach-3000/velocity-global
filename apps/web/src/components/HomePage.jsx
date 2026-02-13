
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { ArrowRight, CheckCircle2, TrendingUp, Users, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1697638164340-6c5fc558bdf2" 
            alt="Modern office building" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-950"></div>
          
          {/* Decorative Elements */}
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        </div>

        {/* Hero Content */}
        <div className="container relative z-10 px-4 mx-auto text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-block mb-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold tracking-wide uppercase backdrop-blur-sm">
              The Future of Leasing Education
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400">
              Master Equipment Leasing
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              The comprehensive platform for professionals to learn, grow, and succeed in the equipment finance industry.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link to="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all duration-300">
                  Start Learning Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Role Selection */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {[
                { icon: TrendingUp, text: "I'm a Financier", color: "text-blue-400", bg: "bg-blue-500/10" },
                { icon: Users, text: "I'm in Sales", color: "text-indigo-400", bg: "bg-indigo-500/10" },
                { icon: Award, text: "I'm a Customer", color: "text-emerald-400", bg: "bg-emerald-500/10" }
              ].map((item, index) => (
                <Link to="/signup" key={index} className="group">
                  <motion.div 
                    variants={fadeIn}
                    whileHover={{ y: -5 }}
                    className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-2xl hover:bg-slate-800/60 hover:border-blue-500/30 transition-all duration-300 cursor-pointer h-full flex flex-col items-center justify-center gap-4 shadow-lg group-hover:shadow-2xl"
                  >
                    <div className={`p-4 rounded-full ${item.bg} group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className={`w-8 h-8 ${item.color}`} />
                    </div>
                    <span className="font-semibold text-lg text-slate-200 group-hover:text-white transition-colors">{item.text}</span>
                  </motion.div>
                </Link>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="container px-4 mx-auto relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Why Choose Our Platform?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              We provide industry-leading education tailored to your specific role in the equipment leasing ecosystem.
            </p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Expert-Led Courses",
                description: "Learn from industry veterans with decades of experience in equipment finance and leasing.",
                icon: Award,
                color: "text-amber-400",
                bg: "bg-amber-500/10"
              },
              {
                title: "Role-Based Learning",
                description: "Curriculum specifically designed for Financiers, Sales Professionals, and Customers.",
                icon: Users,
                color: "text-blue-400",
                bg: "bg-blue-500/10"
              },
              {
                title: "Practical Application",
                description: "Real-world case studies and interactive tools to apply what you learn immediately.",
                icon: CheckCircle2,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10"
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                variants={fadeIn}
                whileHover={{ y: -10 }}
                className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/30 hover:bg-slate-800 transition-all duration-300 shadow-xl hover:shadow-2xl group"
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-lg">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="container px-4 mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white tracking-tight">Ready to advance your career?</h2>
            <p className="text-blue-100 mb-10 text-xl leading-relaxed">
              Join thousands of professionals mastering the art of equipment leasing today.
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 px-10 py-7 text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
