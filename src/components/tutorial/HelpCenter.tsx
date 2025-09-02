import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  BookOpen, 
  Video, 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown,
  Clock,
  User,
  Eye,
  Star,
  Filter,
  X,
  HelpCircle,
  Lightbulb,
  Target,
  Zap,
  TrendingUp,
  Users,
  Settings,
  FileText,
  PlayCircle,
  Download,
  Share2,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =====================================================
// INTERFACES
// =====================================================

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function HelpCenter({ isOpen, onClose }: HelpCenterProps) {
  const navigate = useNavigate();
  const {
    availableFlows,
    completedFlows,
    helpArticles,
    searchQuery,
    filteredArticles,
    searchHelp,
    markArticleHelpful,
    getContextualHelp,
    startTutorial
  } = useTutorial();

  const [activeTab, setActiveTab] = useState('search');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // =====================================================
  // EFECTOS
  // =====================================================

  useEffect(() => {
    if (isOpen) {
      setSearchInput(searchQuery);
    }
  }, [isOpen, searchQuery]);

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const handleSearch = (query: string) => {
    setSearchInput(query);
    searchHelp(query);
  };

  const handleArticleSelect = (articleId: string) => {
    setSelectedArticle(articleId);
  };

  const handleBookmarkToggle = (articleId: string) => {
    setBookmarkedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'onboarding': return <Target className="w-4 h-4" />;
      case 'project-management': return <FileText className="w-4 h-4" />;
      case 'troubleshooting': return <Zap className="w-4 h-4" />;
      case 'advanced': return <TrendingUp className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'onboarding': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'project-management': return 'bg-green-100 text-green-800 border-green-200';
      case 'troubleshooting': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredTutorials = availableFlows.filter(flow => 
    selectedCategory === 'all' || flow.category === selectedCategory
  );

  const filteredHelpArticles = filteredArticles.filter(article =>
    selectedCategory === 'all' || article.category === selectedCategory
  );

  // =====================================================
  // RENDERIZADO
  // =====================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Centro de Ayuda</h2>
                  <p className="text-sm text-slate-500">Encuentra respuestas rápidas</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="search" className="text-xs">
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </TabsTrigger>
                  <TabsTrigger value="tutorials" className="text-xs">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Tutoriales
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="search" className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar en la ayuda..."
                      value={searchInput}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Categories */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Categorías</h3>
                    <div className="space-y-1">
                      {['all', 'onboarding', 'project-management', 'troubleshooting', 'advanced'].map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                            selectedCategory === category
                              ? "bg-blue-100 text-blue-800"
                              : "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            {category === 'all' ? 'Todas' : 
                             category === 'onboarding' ? 'Primeros Pasos' :
                             category === 'project-management' ? 'Gestión de Proyectos' :
                             category === 'troubleshooting' ? 'Solución de Problemas' :
                             'Funcionalidades Avanzadas'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Acciones Rápidas</h3>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => startTutorial('welcome-tour')}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Tour de Bienvenida
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setActiveTab('tutorials')}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Ver Tutoriales
                      </Button>
                    </div>
                  </div>

                  {/* Direct Links */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Ir Directamente a</h3>
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-600 hover:text-slate-800"
                        onClick={() => {
                          navigate('/dashboard');
                          onClose();
                        }}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Dashboard Principal
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-600 hover:text-slate-800"
                        onClick={() => {
                          navigate('/proyectos');
                          onClose();
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Gestión de Proyectos
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-600 hover:text-slate-800"
                        onClick={() => {
                          navigate('/perfil');
                          onClose();
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Mi Perfil
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-600 hover:text-slate-800"
                        onClick={() => {
                          navigate('/configuracion');
                          onClose();
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configuración
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-600 hover:text-slate-800"
                        onClick={() => {
                          navigate('/analytics');
                          onClose();
                        }}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tutorials" className="space-y-4">
                  <div className="space-y-3">
                    {filteredTutorials.map((flow) => (
                      <Card key={flow.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{flow.icon}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-800 truncate">
                                {flow.name}
                              </h4>
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                {flow.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge 
                                  variant="secondary" 
                                  className={cn("text-xs", getDifficultyColor(flow.difficulty))}
                                >
                                  {flow.difficulty === 'beginner' ? 'Principiante' :
                                   flow.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  {flow.estimatedTime} min
                                </div>
                                {completedFlows.includes(flow.id) && (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => startTutorial(flow.id)}
                            disabled={completedFlows.includes(flow.id)}
                          >
                            {completedFlows.includes(flow.id) ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Completado
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Iniciar
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {activeTab === 'search' ? 'Artículos de Ayuda' : 'Tutoriales Disponibles'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {activeTab === 'search' 
                      ? `${filteredHelpArticles.length} artículos encontrados`
                      : `${filteredTutorials.length} tutoriales disponibles`
                    }
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="w-4 h-4 mr-2" />
                  Cerrar
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'search' ? (
                <div className="space-y-4">
                  {filteredHelpArticles.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-600 mb-2">
                        No se encontraron artículos
                      </h3>
                      <p className="text-slate-500">
                        Intenta con otros términos de búsqueda o explora las categorías
                      </p>
                    </div>
                  ) : (
                    filteredHelpArticles.map((article) => (
                      <Card 
                        key={article.id} 
                        className="cursor-pointer hover:shadow-md transition-all duration-200"
                        onClick={() => handleArticleSelect(article.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-slate-800">
                                  {article.title}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", getCategoryColor(article.category))}
                                >
                                  {getCategoryIcon(article.category)}
                                  <span className="ml-1">
                                    {article.category === 'onboarding' ? 'Primeros Pasos' :
                                     article.category === 'project-management' ? 'Gestión' :
                                     article.category === 'troubleshooting' ? 'Solución' : 'Avanzado'}
                                  </span>
                                </Badge>
                              </div>
                              <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                                {article.content.replace(/[#*`]/g, '').substring(0, 150)}...
                              </p>
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {article.author}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(article.lastUpdated).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {article.views} vistas
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  {article.helpful} útiles
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookmarkToggle(article.id);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                {bookmarkedArticles.includes(article.id) ? (
                                  <BookmarkCheck className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Bookmark className="w-4 h-4 text-slate-400" />
                                )}
                              </Button>
                              {article.videoTutorial && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Video className="w-4 h-4 text-slate-400" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTutorials.map((flow) => (
                    <Card key={flow.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{flow.icon}</div>
                          <div>
                            <CardTitle className="text-lg">{flow.name}</CardTitle>
                            <p className="text-sm text-slate-500 mt-1">
                              {flow.description}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getCategoryColor(flow.category))}
                            >
                              {getCategoryIcon(flow.category)}
                              <span className="ml-1">
                                {flow.category === 'onboarding' ? 'Primeros Pasos' :
                                 flow.category === 'feature' ? 'Funcionalidad' :
                                 flow.category === 'advanced' ? 'Avanzado' : 'Solución'}
                              </span>
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", getDifficultyColor(flow.difficulty))}
                            >
                              {flow.difficulty === 'beginner' ? 'Principiante' :
                               flow.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {flow.estimatedTime} minutos
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {flow.steps.length} pasos
                            </div>
                          </div>

                          {flow.completionReward && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm font-medium text-yellow-800">
                                  Recompensa: {flow.completionReward}
                                </span>
                              </div>
                            </div>
                          )}

                          <Button
                            className="w-full"
                            onClick={() => startTutorial(flow.id)}
                            disabled={completedFlows.includes(flow.id)}
                          >
                            {completedFlows.includes(flow.id) ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Completado
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Iniciar Tutorial
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
