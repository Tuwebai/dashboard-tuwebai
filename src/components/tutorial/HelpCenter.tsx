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
      <DialogContent className="max-w-6xl h-[80vh] sm:h-[85vh] p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row h-full">
          {/* Sidebar */}
          <div className="w-full sm:w-80 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-200 flex flex-col max-h-[40vh] sm:max-h-none">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800">Centro de Ayuda</h2>
                  <p className="text-xs sm:text-sm text-slate-500">Encuentra respuestas rápidas</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-3 sm:mb-4">
                  <TabsTrigger value="search" className="text-xs sm:text-sm">
                    <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Buscar</span>
                    <span className="sm:hidden">Buscar</span>
                  </TabsTrigger>
                  <TabsTrigger value="tutorials" className="text-xs sm:text-sm">
                    <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Tutoriales</span>
                    <span className="sm:hidden">Tutoriales</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="search" className="space-y-3 sm:space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                    <Input
                      placeholder="Buscar en la ayuda..."
                      value={searchInput}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-8 sm:pl-10 text-sm"
                    />
                  </div>

                  {/* Categories */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-slate-700 mb-2">Categorías</h3>
                    <div className="space-y-1">
                      {['all', 'onboarding', 'project-management', 'troubleshooting', 'advanced'].map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={cn(
                            "w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors",
                            selectedCategory === category
                              ? "bg-blue-100 text-blue-800"
                              : "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-3 h-3 sm:w-4 sm:h-4">
                              {getCategoryIcon(category)}
                            </div>
                            <span className="truncate">
                              {category === 'all' ? 'Todas' : 
                               category === 'onboarding' ? 'Primeros Pasos' :
                               category === 'project-management' ? 'Gestión' :
                               category === 'troubleshooting' ? 'Solución' :
                               'Avanzado'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-slate-700 mb-2">Acciones Rápidas</h3>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => startTutorial('welcome-tour')}
                      >
                        <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Tour de Bienvenida</span>
                        <span className="sm:hidden">Tour</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => setActiveTab('tutorials')}
                      >
                        <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Ver Tutoriales</span>
                        <span className="sm:hidden">Tutoriales</span>
                      </Button>
                    </div>
                  </div>

                  {/* Direct Links */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-slate-700 mb-2">Ir Directamente a</h3>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-600 hover:text-slate-800 text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => {
                          navigate('/dashboard');
                          onClose();
                        }}
                      >
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Dashboard Principal</span>
                        <span className="sm:hidden">Dashboard</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-600 hover:text-slate-800 text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => {
                          navigate('/proyectos');
                          onClose();
                        }}
                      >
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Gestión de Proyectos</span>
                        <span className="sm:hidden">Proyectos</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-600 hover:text-slate-800 text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => {
                          navigate('/perfil');
                          onClose();
                        }}
                      >
                        <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Mi Perfil</span>
                        <span className="sm:hidden">Perfil</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-600 hover:text-slate-800 text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => {
                          navigate('/configuracion');
                          onClose();
                        }}
                      >
                        <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Configuración</span>
                        <span className="sm:hidden">Config</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-600 hover:text-slate-800 text-xs sm:text-sm h-8 sm:h-9"
                        onClick={() => {
                          navigate('/analytics');
                          onClose();
                        }}
                      >
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">Analytics</span>
                        <span className="sm:hidden">Analytics</span>
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
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                    {activeTab === 'search' ? 'Artículos de Ayuda' : 'Tutoriales Disponibles'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {activeTab === 'search' 
                      ? `${filteredHelpArticles.length} artículos encontrados`
                      : `${filteredTutorials.length} tutoriales disponibles`
                    }
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={onClose} className="ml-2 flex-shrink-0">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Cerrar</span>
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {activeTab === 'search' ? (
                <div className="space-y-3 sm:space-y-4">
                  {filteredHelpArticles.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Search className="w-8 h-8 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-slate-600 mb-2">
                        No se encontraron artículos
                      </h3>
                      <p className="text-sm sm:text-base text-slate-500 px-4">
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
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h4 className="font-semibold text-slate-800 text-sm sm:text-base leading-tight">
                                  {article.title}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs w-fit", getCategoryColor(article.category))}
                                >
                                  <div className="w-3 h-3 sm:w-4 sm:h-4">
                                    {getCategoryIcon(article.category)}
                                  </div>
                                  <span className="ml-1 hidden sm:inline">
                                    {article.category === 'onboarding' ? 'Primeros Pasos' :
                                     article.category === 'project-management' ? 'Gestión' :
                                     article.category === 'troubleshooting' ? 'Solución' : 'Avanzado'}
                                  </span>
                                </Badge>
                              </div>
                              <p className="text-slate-600 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed">
                                {article.content.replace(/[#*`]/g, '').substring(0, 120)}...
                              </p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span className="hidden sm:inline">{article.author}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(article.lastUpdated).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {article.views}
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  {article.helpful}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookmarkToggle(article.id);
                                }}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                {bookmarkedArticles.includes(article.id) ? (
                                  <BookmarkCheck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                                ) : (
                                  <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                                )}
                              </Button>
                              {article.videoTutorial && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                >
                                  <Video className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {filteredTutorials.map((flow) => (
                    <Card key={flow.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="text-2xl sm:text-3xl flex-shrink-0">{flow.icon}</div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base sm:text-lg leading-tight">{flow.name}</CardTitle>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                              {flow.description}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getCategoryColor(flow.category))}
                            >
                              <div className="w-3 h-3 sm:w-4 sm:h-4">
                                {getCategoryIcon(flow.category)}
                              </div>
                              <span className="ml-1 hidden sm:inline">
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
                          
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              {flow.estimatedTime} min
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                              {flow.steps.length} pasos
                            </div>
                          </div>

                          {flow.completionReward && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-2 sm:p-3">
                              <div className="flex items-center gap-2">
                                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                                <span className="text-xs sm:text-sm font-medium text-yellow-800">
                                  <span className="hidden sm:inline">Recompensa: </span>{flow.completionReward}
                                </span>
                              </div>
                            </div>
                          )}

                          <Button
                            className="w-full text-xs sm:text-sm h-8 sm:h-9"
                            onClick={() => startTutorial(flow.id)}
                            disabled={completedFlows.includes(flow.id)}
                          >
                            {completedFlows.includes(flow.id) ? (
                              <>
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Completado</span>
                                <span className="sm:hidden">Listo</span>
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Iniciar Tutorial</span>
                                <span className="sm:hidden">Iniciar</span>
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
