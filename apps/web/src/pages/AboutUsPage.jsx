
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Target, 
  Zap, 
  Brain, 
  TrendingUp, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutUsPage = () => {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      <Helmet>
        <title>About Us - Velocity Global Leasing</title>
        <meta name="description" content="Mastering the Art of Equipment Leasing. Learn about our story, our approach, and how we accelerate expertise in the world of assets." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold tracking-wide uppercase">
              Our Mission
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-slate-400">
              Mastering the Art of <br className="hidden md:block" />
              Equipment Leasing: Our Story
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Accelerating Expertise in the World of Assets
            </p>
          </motion.div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 md:py-24 bg-slate-900/50 border-y border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                More Than Just a <span className="text-blue-500">Training Ground</span>
              </h2>
              <div className="space-y-4 text-slate-300 text-lg leading-relaxed">
                <p>
                  Velocity Global Leasing was founded on a simple yet powerful premise: the equipment finance industry needed a new standard of excellence. We saw a gap between traditional financial training and the dynamic, real-world demands of modern leasing.
                </p>
                <p>
                  We are a collective of industry veterans, financial analysts, and strategic thinkers dedicated to elevating the profession. Our platform isn't just about transferring knowledge; it's about instilling a mindset of precision, agility, and strategic foresight.
                </p>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl transform rotate-3 opacity-20 blur-lg"></div>
              <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Market Leadership</h3>
                    <p className="text-slate-400 mt-1">Setting benchmarks for industry performance.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-indigo-500/20 rounded-lg">
                    <Users className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Community Driven</h3>
                    <p className="text-slate-400 mt-1">Building a network of elite professionals.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Proven Results</h3>
                    <p className="text-slate-400 mt-1">Curriculum backed by real-world success.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why We Started This Quest */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">Why We Started This Quest</h2>
            <p className="text-xl text-slate-300 leading-relaxed mb-12">
              The leasing landscape has shifted. It's no longer just about rates and terms; it's about structuring complex deals, understanding asset lifecycles, and navigating regulatory changes with confidence. We started Velocity Global Leasing to empower professionals to move beyond transaction processing and become true strategic advisors.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Approach - Pillars */}
      <section className="py-20 bg-slate-900 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Our Approach</h2>
            <p className="text-slate-400 text-lg">Built on three fundamental pillars of excellence</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {/* Pillar 1 */}
            <motion.div variants={fadeIn} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl hover:bg-slate-800 transition-colors duration-300 group">
              <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Precision Intelligence</h3>
              <p className="text-slate-400 leading-relaxed">
                We believe in data-driven decision making. Our curriculum teaches you to analyze deals with surgical precision, uncovering value where others see risk.
              </p>
            </motion.div>

            {/* Pillar 2 */}
            <motion.div variants={fadeIn} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl hover:bg-slate-800 transition-colors duration-300 group">
              <div className="w-14 h-14 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Strategic Agility</h3>
              <p className="text-slate-400 leading-relaxed">
                Markets change. Rates fluctuate. We equip you with the mental frameworks to adapt instantly, structuring deals that remain profitable in any economic climate.
              </p>
            </motion.div>

            {/* Pillar 3 */}
            <motion.div variants={fadeIn} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl hover:bg-slate-800 transition-colors duration-300 group">
              <div className="w-14 h-14 bg-amber-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">The Velocity Mindset</h3>
              <p className="text-slate-400 leading-relaxed">
                Speed matters, but not at the cost of accuracy. We train you to be proactive rather than reactive, anticipating client needs before they are spoken.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-20 border-b border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-8 md:p-12 border border-blue-800/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Who This Is For</h2>
                <p className="text-blue-100 text-lg mb-8">
                  Whether you are an aspiring financier looking to break into the industry, or a seasoned professional aiming to sharpen your edge, Velocity Global Leasing provides the tools you need.
                </p>
                <ul className="space-y-4">
                  {[
                    "Equipment Finance Professionals",
                    "Bankers & Credit Analysts",
                    "Leasing Sales Representatives",
                    "Asset Managers"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-slate-200">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm transform translate-y-8">
                    <div className="text-3xl font-bold text-blue-400 mb-1">500+</div>
                    <div className="text-sm text-slate-400">Graduates</div>
                  </div>
                  <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-indigo-400 mb-1">98%</div>
                    <div className="text-sm text-slate-400">Satisfaction</div>
                  </div>
                  <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm transform translate-y-8">
                    <div className="text-3xl font-bold text-emerald-400 mb-1">50+</div>
                    <div className="text-sm text-slate-400">Courses</div>
                  </div>
                  <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-amber-400 mb-1">24/7</div>
                    <div className="text-sm text-slate-400">Access</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Practices & Benchmarking */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Best Practices & Benchmarking</h2>
            <p className="text-slate-400 text-lg">We don't just teach theory; we teach the gold standard.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-blue-500/50 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Benchmarking Analysis</h3>
              <p className="text-slate-400">
                We constantly analyze top performers in the industry to update our curriculum. You learn what is working <em>now</em>, not what worked ten years ago. Our benchmarking reports give you a competitive advantage in understanding market rates and terms.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-2xl hover:border-indigo-500/50 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-indigo-900/50 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Operational Excellence</h3>
              <p className="text-slate-400">
                Efficiency is the key to profitability. We share best practices for workflow automation, documentation management, and client communication that reduce friction and accelerate deal closure.
              </p>
            </motion.div>
          </div>

          <div className="mt-16 text-center">
            <Link to="/courses">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-blue-900/20">
                Explore Our Courses <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
