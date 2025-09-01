import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { securityMiddleware } from '@/lib/securityMiddleware';
import { toast } from '@/hooks/use-toast';

export interface SecurityState {
  isAuthenticated: boolean;
  user: any | null;
  needsRefresh: boolean;
  isBlocked: boolean;
  blockReason?: string;
  blockUntil?: Date;
  csrfToken: string | null;
  rateLimitInfo: {
    remaining: number;
    resetTime: number;
  } | null;
}

export function useSecurity() {
  const { user, isAuthenticated } = useApp();
  const [securityState, setSecurityState] = useState<SecurityState>({
    isAuthenticated: false,
    user: null,
    needsRefresh: false,
    isBlocked: false,
    csrfToken: null,
    rateLimitInfo: null
  });
  const [loading, setLoading] = useState(true);

  // Verificar estado de seguridad
  const checkSecurity = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setSecurityState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        needsRefresh: false,
        isBlocked: false,
        csrfToken: null
      }));
      setLoading(false);
      return;
    }

    try {
      // Verificar autenticación
      const authResult = await securityMiddleware.verifyAuthentication();
      
      if (!authResult.valid) {
        setSecurityState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          needsRefresh: false,
          isBlocked: false,
          csrfToken: null
        }));
        setLoading(false);
        return;
      }

      // Verificar si el usuario está bloqueado
      const blockResult = await securityMiddleware.isUserBlocked(user.id);
      
      // Generar token CSRF
      const csrfToken = securityMiddleware.generateCSRFToken(user.id);

      setSecurityState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: authResult.user,
        needsRefresh: authResult.needsRefresh || false,
        isBlocked: blockResult.blocked,
        blockReason: blockResult.reason,
        blockUntil: blockResult.until,
        csrfToken
      }));

    } catch (error) {
      console.error('Error checking security:', error);
      setSecurityState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        needsRefresh: false,
        isBlocked: false,
        csrfToken: null
      }));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Verificar rate limit
  const checkRateLimit = useCallback(async (identifier?: string) => {
    const clientId = identifier || user?.id || 'anonymous';
    const result = await securityMiddleware.checkRateLimit(clientId);
    
    setSecurityState(prev => ({
      ...prev,
      rateLimitInfo: {
        remaining: result.remaining,
        resetTime: result.resetTime
      }
    }));

    return result;
  }, [user?.id]);

  // Verificar permisos
  const checkPermissions = useCallback(async (
    requiredRole?: string,
    requiredPermissions?: string[]
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      return await securityMiddleware.verifyUserPermissions(
        user.id,
        requiredRole,
        requiredPermissions
      );
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }, [user]);

  // Detectar actividad sospechosa
  const detectSuspiciousActivity = useCallback((activity: Record<string, any>) => {
    if (!user) return false;

    return securityMiddleware.detectSuspiciousActivity(user.id, activity);
  }, [user]);

  // Obtener headers de seguridad
  const getSecurityHeaders = useCallback(() => {
    return securityMiddleware.getSecurityHeaders();
  }, []);

  // Procesar request con seguridad
  const processSecureRequest = useCallback(async (
    request: Request,
    options: {
      requireAuth?: boolean;
      requiredRole?: string;
      requiredPermissions?: string[];
      skipRateLimit?: boolean;
    } = {}
  ) => {
    return await securityMiddleware.processRequest(request, options);
  }, []);

  // Refrescar sesión
  const refreshSession = useCallback(async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;

      toast({
        title: "Sesión actualizada",
        description: "Tu sesión se ha renovado correctamente."
      });

      await checkSecurity();
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      toast({
        title: "Error",
        description: "No se pudo renovar la sesión.",
        variant: "destructive"
      });
      return false;
    }
  }, [user]);

  // Obtener estadísticas de seguridad
  const getSecurityStats = useCallback(() => {
    return securityMiddleware.getSecurityStats();
  }, []);

  // Efecto para verificar seguridad al cambiar el usuario
  useEffect(() => {
    checkSecurity();
  }, [checkSecurity]);

  // Efecto para verificar rate limit periódicamente
  useEffect(() => {
    if (isAuthenticated && user) {
      const interval = setInterval(() => {
        checkRateLimit();
      }, 60000); // Cada minuto

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, checkRateLimit]);

  // Efecto para manejar sesión que necesita refresh
  useEffect(() => {
    if (securityState.needsRefresh && !loading) {
      refreshSession();
    }
  }, [securityState.needsRefresh, loading, refreshSession]);

  // Efecto para manejar usuario bloqueado
  useEffect(() => {
    if (securityState.isBlocked && securityState.blockReason) {
      toast({
        title: "Cuenta bloqueada",
        description: `Tu cuenta está bloqueada: ${securityState.blockReason}`,
        variant: "destructive"
      });
    }
  }, [securityState.isBlocked, securityState.blockReason]);

  return {
    // Estado
    securityState,
    loading,
    
    // Funciones
    checkSecurity,
    checkRateLimit,
    checkPermissions,
    detectSuspiciousActivity,
    getSecurityHeaders,
    processSecureRequest,
    refreshSession,
    getSecurityStats,
    
    // Utilidades
    isAuthenticated: securityState.isAuthenticated,
    user: securityState.user,
    isBlocked: securityState.isBlocked,
    csrfToken: securityState.csrfToken,
    rateLimitInfo: securityState.rateLimitInfo
  };
}
