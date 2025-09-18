'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, Shield, Globe, BarChart3, Code, Sparkles, TrendingUp, Users, Clock, MessageCircle, ArrowUp, ExternalLink, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
              <span className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>
                pokt.ai
              </span>
            </Link>
          </motion.div>
          <nav className="hidden md:flex items-center space-x-8">
            <motion.div whileHover={{ y: -2 }}>
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }}>
              <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -2 }}>
              <a 
                href="https://explorer.pokt.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }}>
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link href="/login">
                <Button>Get Started</Button>
              </Link>
            </motion.div>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="container mx-auto px-4 py-20 text-center relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
        >
          <Badge variant="secondary" className="mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
            </motion.div>
            AI-Powered RPC Gateway
          </Badge>
        </motion.div>
        
        <motion.h1 
          className="font-heading text-6xl font-bold text-primary mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Build the Future of
          <br />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Web3 Infrastructure
          </span>
        </motion.h1>
        
        <motion.p 
          className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Build faster, scale better, and optimize costs with our intelligent RPC gateway 
          built on top of Pocket Network Shannon + PATH.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6 relative overflow-hidden group">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
                <span className="relative z-10">Start Building</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="ml-2 w-5 h-5 relative z-10" />
                </motion.div>
              </Button>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/docs">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                View Documentation
              </Button>
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <a 
              href="https://explorer.pokt.ai" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0">
                <Search className="mr-2 w-5 h-5" />
                Explorer
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </motion.div>
        </motion.div>

        {/* Live stats */}
        <motion.div 
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="text-3xl font-bold text-primary mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              <span className="text-3xl font-bold text-primary">
                99.9%
              </span>
            </motion.div>
            <p className="text-sm text-muted-foreground">Uptime</p>
          </motion.div>
          
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="text-3xl font-bold text-primary mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1.6 }}
            >
              <span className="text-3xl font-bold text-primary">
                45ms
              </span>
            </motion.div>
            <p className="text-sm text-muted-foreground">Avg Latency</p>
          </motion.div>
          
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="text-3xl font-bold text-primary mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1.8 }}
            >
              <span className="text-3xl font-bold text-primary">
                10M+
              </span>
            </motion.div>
            <p className="text-sm text-muted-foreground">Daily Requests</p>
          </motion.div>
          
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="text-3xl font-bold text-primary mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 2.0 }}
            >
              <span className="text-3xl font-bold text-primary">
                50+
              </span>
            </motion.div>
            <p className="text-sm text-muted-foreground">Countries</p>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Supported Blockchains Banner */}
      <motion.section 
        className="py-16 bg-gradient-to-r from-slate-50 to-blue-50/50 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl font-bold text-primary mb-4">
              Supported Blockchain Networks
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect to 50+ blockchain networks with enterprise-grade reliability and lightning-fast performance
            </p>
          </motion.div>
          
          {/* Blockchain Network Grid */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 max-w-7xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Major Networks */}
            {[
              { name: 'Ethereum', symbol: 'ETH', color: 'from-blue-500 to-blue-600' },
              { name: 'Polygon', symbol: 'MATIC', color: 'from-purple-500 to-purple-600' },
              { name: 'Arbitrum', symbol: 'ARB', color: 'from-blue-400 to-blue-500' },
              { name: 'Optimism', symbol: 'OP', color: 'from-red-500 to-red-600' },
              { name: 'Base', symbol: 'BASE', color: 'from-blue-600 to-indigo-600' },
              { name: 'Avalanche', symbol: 'AVAX', color: 'from-red-400 to-red-500' },
              { name: 'BSC', symbol: 'BNB', color: 'from-yellow-400 to-yellow-500' },
              { name: 'Fantom', symbol: 'FTM', color: 'from-blue-500 to-cyan-500' },
              { name: 'Solana', symbol: 'SOL', color: 'from-purple-400 to-pink-500' },
              { name: 'Cosmos', symbol: 'ATOM', color: 'from-indigo-500 to-purple-600' },
              { name: 'Gnosis', symbol: 'GNO', color: 'from-green-500 to-emerald-600' },
              { name: 'Celo', symbol: 'CELO', color: 'from-green-400 to-green-500' },
              { name: 'Blast', symbol: 'BLAST', color: 'from-yellow-500 to-orange-500' },
              { name: 'Kava', symbol: 'KAVA', color: 'from-red-500 to-pink-500' },
              { name: 'Oasys', symbol: 'OAS', color: 'from-teal-500 to-cyan-500' },
              { name: 'POKT', symbol: 'POKT', color: 'from-indigo-600 to-blue-700' },
            ].map((network, index) => (
              <motion.div
                key={network.name}
                className="group"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 group-hover:border-primary/20">
                  <motion.div 
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${network.color} flex items-center justify-center mb-3 mx-auto`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <span className="text-white font-bold text-sm">
                      {network.symbol.slice(0, 3)}
                    </span>
                  </motion.div>
                  <h3 className="text-sm font-semibold text-gray-800 text-center">
                    {network.name}
                  </h3>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          {/* View All Networks Button */}
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a 
                href="https://explorer.pokt.ai" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="px-8 py-3">
                  <Globe className="mr-2 w-4 h-4" />
                  View All Networks
                  <ExternalLink className="ml-2 w-3 h-3" />
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-tr from-accent/10 to-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="container mx-auto px-4 py-20 relative z-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-4xl font-bold text-primary mb-4">
            Why Choose pokt.ai?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Enterprise-grade infrastructure with AI-powered optimization
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <motion.div 
                  className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Zap className="w-6 h-6 text-primary" />
                </motion.div>
                <CardTitle className="font-heading">Lightning Fast</CardTitle>
                <CardDescription>
                  Sub-50ms latency with intelligent routing and load balancing across global nodes.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <motion.div 
                  className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Shield className="w-6 h-6 text-secondary" />
                </motion.div>
                <CardTitle className="font-heading">Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-grade security with end-to-end encryption, rate limiting, and DDoS protection.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <motion.div 
                  className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Globe className="w-6 h-6 text-accent" />
                </motion.div>
                <CardTitle className="font-heading">Global Network</CardTitle>
                <CardDescription>
                  Deployed across 50+ countries with automatic failover and geographic routing.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <motion.div 
                  className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <BarChart3 className="w-6 h-6 text-primary" />
                </motion.div>
                <CardTitle className="font-heading">Real-time Analytics</CardTitle>
                <CardDescription>
                  Comprehensive dashboards with usage metrics, performance insights, and cost optimization.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <motion.div 
                  className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Code className="w-6 h-6 text-accent" />
                </motion.div>
                <CardTitle className="font-heading">Developer First</CardTitle>
                <CardDescription>
                  Simple API, comprehensive SDKs, and detailed documentation to get you started quickly.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <motion.div 
                  className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Zap className="w-6 h-6 text-primary" />
                </motion.div>
                <CardTitle className="font-heading">Pay-as-you-go</CardTitle>
                <CardDescription>
                  No upfront costs. Pay only for what you use with transparent, metered billing.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="bg-primary text-white py-20 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Animated background elements */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full opacity-10"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 40% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h2 
            className="font-heading text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p 
            className="text-xl mb-8 opacity-90 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join thousands of developers building the future of Web3 with pokt.ai
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/login">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 relative overflow-hidden group">
                <motion.div
                  className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
                <span className="relative z-10">Start Your Free Trial</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="ml-2 w-5 h-5 relative z-10" />
                </motion.div>
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="bg-neutral border-t py-12 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <motion.div 
              className="flex items-center space-x-2 mb-4 md:mb-0"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
                <motion.span 
                  className="text-xl font-bold"
                  style={{ color: '#1E3A8A' }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  pokt.ai
                </motion.span>
              </Link>
            </motion.div>
            <motion.div 
              className="flex space-x-6 text-sm text-muted-foreground"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.div whileHover={{ y: -2 }}>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }}>
                <Link href="/docs" className="hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }}>
                <a 
                  href="https://explorer.pokt.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
              <motion.div whileHover={{ y: -2 }}>
                <Link href="/changelog" className="hover:text-foreground transition-colors">
                  Changelog
                </Link>
              </motion.div>
            </motion.div>
          </div>
          <motion.div 
            className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <p>&copy; 2024 pokt.ai. All rights reserved.</p>
          </motion.div>
        </div>
      </motion.footer>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 2.5 }}
      >
        <motion.button
          className="w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Floating Chat Button */}
      <motion.div
        className="fixed bottom-6 left-6 z-50"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 3.0 }}
      >
        <motion.button
          className="w-14 h-14 bg-secondary text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      </motion.div>
    </div>
  );
}
