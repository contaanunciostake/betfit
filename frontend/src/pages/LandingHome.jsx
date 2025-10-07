import { motion } from 'framer-motion';
import { Trophy, Users, DollarSign, Zap, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingHome() {
  const stats = [
    { icon: Trophy, label: 'Desafios Ativos', value: '1,500+' },
    { icon: Users, label: 'Atletas', value: '5,000+' },
    { icon: DollarSign, label: 'Em Prêmios', value: 'R$ 250k+' },
    { icon: Zap, label: 'Taxa de Vitória', value: '85%' }
  ];

  const features = [
    {
      icon: Trophy,
      title: 'Desafios Reais',
      description: 'Compita com outros atletas em desafios reais de fitness e ganhe prêmios'
    },
    {
      icon: Users,
      title: 'Comunidade Ativa',
      description: 'Junte-se a milhares de atletas motivados e comprometidos'
    },
    {
      icon: DollarSign,
      title: 'Prêmios em Dinheiro',
      description: 'Ganhe dinheiro real ao atingir seus objetivos de fitness'
    },
    {
      icon: Zap,
      title: 'Resultados Rápidos',
      description: 'Veja melhorias em sua performance em semanas'
    }
  ];

  const testimonials = [
    {
      name: 'João Silva',
      role: 'Corredor',
      image: '👨‍💼',
      text: 'Perdi 10kg em 3 meses e ainda ganhei R$ 500 em prêmios!'
    },
    {
      name: 'Maria Santos',
      role: 'Ciclista',
      image: '👩‍🦰',
      text: 'A competição me motiva todos os dias. Melhor investimento!'
    },
    {
      name: 'Carlos Oliveira',
      role: 'Atleta',
      image: '👨‍🦲',
      text: 'Comunidade incrível e desafios que realmente funcionam!'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/20"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1
              className="text-5xl md:text-7xl font-black text-white mb-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              Transforme
              <br />
              <span className="text-yellow-400">Fitness em Renda</span>
            </motion.h1>

            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Participe de desafios fitness, compita com atletas reais e ganhe prêmios em dinheiro.
              Sua jornada fitness nunca foi tão recompensadora!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-yellow-400 text-gray-900 font-bold rounded-full text-lg shadow-2xl hover:bg-yellow-300 transition-colors flex items-center gap-2"
                >
                  Começar Agora
                  <ArrowRight size={20} />
                </motion.button>
              </Link>

              <Link to="/como-funciona">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-bold rounded-full text-lg border-2 border-white/50 hover:bg-white/30 transition-colors"
                >
                  Como Funciona
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="currentColor" className="text-gray-50 dark:text-gray-900"/>
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl text-center"
            >
              <stat.icon className="w-10 h-10 mx-auto mb-3 text-indigo-600 dark:text-indigo-400" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Por que BetFit?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A plataforma que une fitness, competição e recompensas reais
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-gray-100 dark:bg-gray-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              O Que Dizem Nossos Atletas
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={16} />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "{testimonial.text}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pronto Para Transformar Seu Fitness?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Junte-se a milhares de atletas e comece a ganhar hoje mesmo!
            </p>
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-yellow-400 text-gray-900 font-bold rounded-full text-xl shadow-2xl hover:bg-yellow-300 transition-colors inline-flex items-center gap-3"
              >
                <CheckCircle size={24} />
                Criar Conta Grátis
                <ArrowRight size={24} />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
