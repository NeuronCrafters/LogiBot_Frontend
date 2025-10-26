import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { driver, type DriveStep, type Side } from 'driver.js';
import 'driver.js/dist/driver.css';

// Chave para controlar quais páginas já tiveram tour
const TOUR_COMPLETED_PAGES_KEY = 'logibots-tour-completed-pages';

interface TourActions {
    openMenu?: () => void;
    closeMenu?: () => void;
}

export type UserRole = "student" | "teacher" | "course-coordinator" | "admin" | "guest";

interface CustomDriveStep extends Omit<DriveStep, 'popover'> {
    element: string;
    popover: {
        title: string;
        description: string;
        side: Side;
    };
    onHighlightStartedAction?: keyof TourActions;
}

// Tours por página - cada página é independente
const generatePageTours = (role: UserRole): Record<string, CustomDriveStep[]> => {
    return {
        '/': [
            { element: '#welcome-title', popover: { title: 'Bem-vindo ao LogiBots.IA!', description: 'Vamos fazer um tour rápido por esta página.', side: 'bottom' }},
            { element: '#animated-logo', popover: { title: 'Nosso Mascote Lógico', description: 'Ele estará com você durante sua jornada de aprendizado.', side: 'left' }},
            { element: '#play-button', popover: { title: 'Comece a Aprender', description: 'Clique aqui para ir à tela de login quando estiver pronto!', side: 'bottom' }},
        ],

        '/signin': [
            { element: '#signin-email-input', popover: { title: 'Acesse sua Conta', description: 'Digite aqui o e-mail que você usou para se cadastrar.', side: 'bottom' }},
            { element: '#signin-password-input', popover: { title: 'Sua Senha', description: 'Agora, digite sua senha secreta para acessar sua conta.', side: 'bottom' }},
            { element: '#signin-submit-button', popover: { title: 'Acessar a Plataforma', description: 'Clique aqui para entrar na plataforma!', side: 'bottom' }},
            { element: '#signin-signup-link', popover: { title: 'Novo por aqui?', description: 'Se você ainda não tem uma conta, pode clicar aqui para se cadastrar.', side: 'top' }},
        ],

        '/signup': [
            { element: '#signup-name-input', popover: { title: 'Seu Nome Completo', description: 'Digite seu nome. Ele será usado para personalizar sua experiência.', side: 'bottom' }},
            { element: '#signup-email-input', popover: { title: 'Seu Melhor E-mail', description: 'Use um e-mail válido para criar sua conta.', side: 'bottom' }},
            { element: '#signup-password-input', popover: { title: 'Crie uma Senha Segura', description: 'Escolha uma senha com pelo menos 12 caracteres.', side: 'bottom' }},
            { element: '#signup-code-input', popover: { title: 'Código da Turma', description: 'Este é o código fornecido pelo seu professor.', side: 'top' }},
            { element: '#signup-submit-button', popover: { title: 'Finalizar Cadastro', description: 'Clique aqui para criar sua conta e começar a aprender!', side: 'top' }},
        ],

        '/chat': [
            { element: '#chat-initial-choice', popover: { title: 'Sua Área de Estudos', description: 'Você chegou! Escolha entre praticar com um Quiz ou conversar com o bot para tirar dúvidas.', side: 'bottom' }},
            { element: '#chat-header-menu-button', popover: { title: 'Menu Principal', description: 'Clique no seu avatar para ver as opções da plataforma.', side: 'left' }},
            { element: '#header-menu-options', popover: { title: 'Painel de Navegação', description: 'Aqui você acessa todas as áreas importantes.', side: 'bottom' }, onHighlightStartedAction: 'openMenu' },
            { element: '#menu-option-detalhes', popover: { title: 'Seu Perfil', description: 'Aqui você vê os detalhes da sua conta.', side: 'bottom' }, onHighlightStartedAction: 'openMenu' },

            ...(role !== 'student' ? [
                {
                    element: '#menu-option-resultados',
                    popover: { title: 'Resultados', description: 'Acesse os dashboards com o desempenho dos alunos.', side: 'bottom' as Side },
                    onHighlightStartedAction: 'openMenu' as const
                },
                {
                    element: '#menu-option-criar',
                    popover: { title: 'Criar Conteúdo', description: 'Nesta área você pode criar novas turmas, disciplinas e questões.', side: 'bottom' as Side },
                    onHighlightStartedAction: 'openMenu' as const
                },
            ] : []),

            { element: '#header-logout-button', popover: { title: 'Encerrar Sessão', description: 'Quando terminar, é só clicar aqui para sair. Bom aprendizado!', side: 'top' as Side }, onHighlightStartedAction: 'openMenu' },
        ],

        '/about': [
            { element: '#about-card-content', popover: { title: 'Seu Perfil Pessoal', description: 'Este é o seu cartão de perfil, com suas informações acadêmicas e de conta.', side: 'bottom' }},
            { element: '#about-user-details', popover: { title: 'Seus Dados', description: 'Aqui você pode conferir seu nome, e-mail, curso e outras informações.', side: 'left' }},
            ...(role === 'teacher' || role === 'course-coordinator' ? [
                {
                    element: '#about-discipline-codes',
                    popover: { title: 'Códigos das Disciplinas', description: 'Clique aqui para ver e copiar os códigos de convite para suas disciplinas.', side: 'top' as Side }
                }
            ] : []),
            { element: '#about-change-password-button', popover: { title: 'Segurança da Conta', description: 'Precisa atualizar sua senha? Você pode fazer isso a qualquer momento aqui.', side: 'top' }},
        ],
    };
};

// Gerencia quais páginas já tiveram tour completo
const getCompletedPages = (): string[] => {
    try {
        const stored = localStorage.getItem(TOUR_COMPLETED_PAGES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const markPageAsCompleted = (pathname: string) => {
    const completed = getCompletedPages();
    if (!completed.includes(pathname)) {
        completed.push(pathname);
        localStorage.setItem(TOUR_COMPLETED_PAGES_KEY, JSON.stringify(completed));
    }
};

const isPageCompleted = (pathname: string): boolean => {
    return getCompletedPages().includes(pathname);
};

export const useMultiPageTour = (role: UserRole = 'guest', actions: TourActions = {}) => {
    const location = useLocation();
    const pageTours = generatePageTours(role);
    const hasInitialized = useRef(false);
    const currentDriverRef = useRef<ReturnType<typeof driver> | null>(null);

    const cleanupDriver = () => {
        if (currentDriverRef.current) {
            try {
                currentDriverRef.current.destroy();
            } catch (e) {
                // Ignora erros
            }
            currentDriverRef.current = null;
        }
    };

    const runPageTour = (pathname: string) => {
        console.log(`[Tour] runPageTour chamado para ${pathname}`);
        cleanupDriver();

        const steps = pageTours[pathname];
        if (!steps || steps.length === 0) {
            console.log(`[Tour] Nenhum tour definido para ${pathname}`);
            return;
        }

        console.log(`[Tour] Criando driver com ${steps.length} steps...`);

        const driverObj = driver({
            showProgress: true,
            animate: true,
            popoverClass: 'logibots-tour-popover',
            onDestroyed: () => {
                console.log(`[Tour] Tour de ${pathname} concluído!`);
                markPageAsCompleted(pathname);
                actions.closeMenu?.();
                cleanupDriver();
            },
            onDeselected: () => {
                console.log(`[Tour] Step avançado`);
            }
        });

        currentDriverRef.current = driverObj;

        // Adiciona as actions customizadas
        const stepsWithActions = steps.map(step => ({
            ...step,
            onHighlightStarted: () => {
                if (step.onHighlightStartedAction && actions[step.onHighlightStartedAction]) {
                    console.log(`[Tour] Executando action: ${step.onHighlightStartedAction}`);
                    actions[step.onHighlightStartedAction]!();
                }
            }
        }));

        console.log(`[Tour] Configurando steps e iniciando driver...`);
        driverObj.setSteps(stepsWithActions);
        driverObj.drive();
        console.log(`[Tour] Driver iniciado!`);
    };

    // ============================================================
    // LÓGICA AUTOMÁTICA: Inicia tour da página se ainda não viu
    // ============================================================
    useEffect(() => {
        // Reseta flag ao mudar de página
        hasInitialized.current = false;

        const pathname = location.pathname;
        const pageHasTour = pageTours[pathname] && pageTours[pathname].length > 0;
        const alreadyCompleted = isPageCompleted(pathname);

        console.log('[Tour Debug]', {
            pathname,
            hasTour: pageHasTour,
            toursAvailable: Object.keys(pageTours),
            completed: alreadyCompleted,
            completedPages: getCompletedPages(),
            hasInitRef: hasInitialized.current
        });

        // Se não tem tour ou já foi completado, não faz nada
        if (!pageHasTour) {
            console.log(`[Tour] Página ${pathname} não tem tour definido`);
            return;
        }

        if (alreadyCompleted) {
            console.log(`[Tour] Tour de ${pathname} já foi completado`);
            return;
        }

        if (hasInitialized.current) {
            console.log(`[Tour] Tour de ${pathname} já foi inicializado nesta montagem`);
            return;
        }

        hasInitialized.current = true;
        console.log(`[Tour] Preparando para iniciar tour de ${pathname}...`);

        // Aguarda elementos estarem no DOM
        const timer = setTimeout(() => {
            const firstStep = pageTours[pathname][0];
            const firstElementSelector = typeof firstStep.element === 'string'
                ? firstStep.element
                : '#unknown';
            const firstElement = document.querySelector(firstElementSelector);

            console.log(`[Tour] Procurando ${firstElementSelector}:`, firstElement);

            if (firstElement) {
                console.log(`[Tour] Elemento encontrado! Iniciando tour de ${pathname}...`);
                runPageTour(pathname);
            } else {
                console.warn(`[Tour] Elemento ${firstElementSelector} não encontrado em ${pathname}`);
                hasInitialized.current = false;
            }
        }, 600);

        return () => {
            clearTimeout(timer);
        };
    }, [location.pathname, role]);

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            cleanupDriver();
        };
    }, []);

    // Função para resetar tours (útil para debug)
    const resetTour = (pathname?: string) => {
        if (pathname) {
            // Reseta tour de uma página específica
            const completed = getCompletedPages();
            const filtered = completed.filter(p => p !== pathname);
            localStorage.setItem(TOUR_COMPLETED_PAGES_KEY, JSON.stringify(filtered));
            console.log(`[Tour] Tour de ${pathname} resetado!`);
        } else {
            // Reseta todos os tours
            localStorage.removeItem(TOUR_COMPLETED_PAGES_KEY);
            console.log('[Tour] Todos os tours resetados!');
        }
        cleanupDriver();
    };

    // Expõe função globalmente para debug
    if (typeof window !== 'undefined') {
        (window as any).resetLogiBotsTour = resetTour;
    }

    return { resetTour };
};