import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { driver, type DriveStep, type Side } from 'driver.js';
import 'driver.js/dist/driver.css';

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

const generatePageTours = (role: UserRole): Record<string, CustomDriveStep[]> => {

    let chatTourSteps: CustomDriveStep[] = [];

    switch (role) {
        case 'student':
            chatTourSteps = [
                { element: '#chat-container', popover: { title: 'Área de Aprendizado', description: 'Bem-vindo! Aqui você pode escolher entre Quiz (responder 5 perguntas) ou Chat (conversar sobre lógica).', side: 'bottom' as Side } },
                { element: '#chat-header-menu-button', popover: { title: 'Menu de Navegação', description: 'Clique no seu avatar a qualquer momento para acessar as opções.', side: 'left' as Side } },
                { element: '#header-menu-options', popover: { title: 'Opções do Menu', description: 'Neste menu você pode navegar entre as funcionalidades da sua conta.', side: 'left' as Side }, onHighlightStartedAction: 'openMenu' },
                { element: '#menu-option-detalhes', popover: { title: 'Seu Perfil', description: 'Veja e edite as informações da sua conta.', side: 'bottom' as Side }, onHighlightStartedAction: 'openMenu' },
                { element: '#menu-option-chat', popover: { title: 'Voltar ao Chat', description: 'Clique aqui para retornar à tela de conversa ou quiz a qualquer momento.', side: 'bottom' as Side }, onHighlightStartedAction: 'openMenu' },
                { element: '#header-logout-button', popover: { title: 'Encerrar Sessão', description: 'Quando terminar, é só clicar aqui para sair. Bom aprendizado!', side: 'top' as Side }, onHighlightStartedAction: 'openMenu' },
            ];
            break;

        case 'teacher':
        case 'course-coordinator':
        case 'admin':
            chatTourSteps = [
                { element: '#chat-header-menu-button', popover: { title: 'Bem-vindo à Gestão', description: 'Esta é sua área principal. Clique no seu avatar para abrir o menu e acessar as funcionalidades.', side: 'left' as Side } },
                { element: '#header-menu-options', popover: { title: 'Menu de Opções', description: 'Neste menu você pode navegar entre as funcionalidades de gestão disponíveis para o seu perfil.', side: 'left' as Side }, onHighlightStartedAction: 'openMenu' },
                { element: '#menu-option-detalhes', popover: { title: 'Seu Perfil', description: 'Veja e edite as informações da sua conta.', side: 'bottom' as Side }, onHighlightStartedAction: 'openMenu' },
                { element: '#menu-option-resultados', popover: { title: 'Resultados e Dashboards', description: 'Acesse os dashboards com o desempenho dos alunos e outras métricas.', side: 'bottom' as Side }, onHighlightStartedAction: 'openMenu' },
                { element: '#menu-option-criar', popover: { title: 'Criar Conteúdo', description: 'Nesta área você pode criar e gerenciar novas turmas, disciplinas e questões.', side: 'bottom' as Side }, onHighlightStartedAction: 'openMenu' },
                { element: '#header-logout-button', popover: { title: 'Encerrar Sessão', description: 'Quando terminar, é só clicar aqui para sair. Boas atividades!', side: 'top' as Side }, onHighlightStartedAction: 'openMenu' },
            ];
            break;

        default:
            chatTourSteps = [];
            break;
    }


    return {
        '/': [
            { element: '#welcome-title', popover: { title: 'Bem-vindo ao LogiBots.IA!', description: 'Vamos fazer um tour rápido por esta página.', side: 'bottom' as Side } },
            { element: '#animated-logo', popover: { title: 'Nosso Mascote Lógico', description: 'Ele estará com você durante sua jornada de aprendizado.', side: 'left' as Side } },
            { element: '#play-button', popover: { title: 'Comece a Aprender', description: 'Clique aqui para ir à tela de login quando estiver pronto!', side: 'bottom' as Side } },
        ],

        '/signin': [
            { element: '#signin-email-input', popover: { title: 'Acesse sua Conta', description: 'Digite aqui o e-mail que você usou para se cadastrar.', side: 'bottom' as Side } },
            { element: '#signin-password-input', popover: { title: 'Sua Senha', description: 'Agora, digite sua senha secreta para acessar sua conta.', side: 'bottom' as Side } },
            { element: '#signin-submit-button', popover: { title: 'Acessar a Plataforma', description: 'Clique aqui para entrar na plataforma!', side: 'bottom' as Side } },
            { element: '#signin-signup-link', popover: { title: 'Novo por aqui?', description: 'Se você ainda não tem uma conta, pode clicar aqui para se cadastrar.', side: 'top' as Side } },
        ],

        '/signup': [
            { element: '#signup-name-input', popover: { title: 'Seu Nome Completo', description: 'Digite seu nome. Ele será usado para personalizar sua experiência.', side: 'bottom' as Side } },
            { element: '#signup-email-input', popover: { title: 'Seu Melhor E-mail', description: 'Use um e-mail válido para criar sua conta.', side: 'bottom' as Side } },
            { element: '#signup-password-input', popover: { title: 'Crie uma Senha Segura', description: 'Escolha uma senha com pelo menos 12 caracteres.', side: 'bottom' as Side } },
            { element: '#signup-code-input', popover: { title: 'Código da Turma', description: 'Este é o código fornecido pelo seu professor.', side: 'top' as Side } },
            { element: '#signup-submit-button', popover: { title: 'Finalizar Cadastro', description: 'Clique aqui para criar sua conta e começar a aprender!', side: 'top' as Side } },
        ],

        '/chat': chatTourSteps,

        '/about': [
            { element: '#about-card-content', popover: { title: 'Seu Perfil Pessoal', description: 'Este é o seu cartão de perfil, com suas informações acadêmicas e de conta.', side: 'bottom' as Side } },
            { element: '#about-user-details', popover: { title: 'Seus Dados', description: 'Aqui você pode conferir seu nome, e-mail, curso e outras informações.', side: 'left' as Side } },
            ...(role === 'teacher' || role === 'course-coordinator' ? [
                {
                    element: '#about-discipline-codes',
                    popover: { title: 'Códigos das Disciplinas', description: 'Clique aqui para ver e copiar os códigos de convite para suas disciplinas.', side: 'top' as Side }
                }
            ] : []),
            { element: '#about-change-password-button', popover: { title: 'Segurança da Conta', description: 'Precisa atualizar sua senha? Você pode fazer isso a qualquer momento aqui.', side: 'top' as Side } },
        ],
    };
};

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
            } catch (e) { }
            currentDriverRef.current = null;
        }
    };

    const runPageTour = (pathname: string) => {
        (`[Tour] runPageTour chamado para ${pathname}`);
        cleanupDriver();

        const steps = pageTours[pathname];
        if (!steps || steps.length === 0) {
            (`[Tour] Nenhum tour definido para ${pathname}`);
            return;
        }

        (`[Tour] Criando driver com ${steps.length} steps...`);

        const driverObj = driver({
            showProgress: true,
            animate: true,
            popoverClass: 'logibots-tour-popover',
            onDestroyed: () => {
                (`[Tour] Tour de ${pathname} concluído!`);
                markPageAsCompleted(pathname);
                actions.closeMenu?.();
                cleanupDriver();
            },
            onDeselected: () => {
                (`[Tour] Step avançado`);
            }
        });

        currentDriverRef.current = driverObj;

        const stepsWithActions = steps.map(step => ({
            ...step,
            onHighlightStarted: () => {
                if (step.onHighlightStartedAction && actions[step.onHighlightStartedAction]) {
                    (`[Tour] Executando action: ${step.onHighlightStartedAction}`);
                    actions[step.onHighlightStartedAction]!();
                }
            }
        }));

        (`[Tour] Configurando steps e iniciando driver...`);
        driverObj.setSteps(stepsWithActions);
        driverObj.drive();
        (`[Tour] Driver iniciado!`);
    };

    useEffect(() => {
        hasInitialized.current = false;

        const pathname = location.pathname;
        const pageHasTour = pageTours[pathname] && pageTours[pathname].length > 0;
        const alreadyCompleted = isPageCompleted(pathname);

        ('[Tour Debug]', {
            pathname,
            hasTour: pageHasTour,
            toursAvailable: Object.keys(pageTours),
            completed: alreadyCompleted,
            completedPages: getCompletedPages(),
            hasInitRef: hasInitialized.current
        });

        if (!pageHasTour) {
            (`[Tour] Página ${pathname} não tem tour definido`);
            return;
        }

        if (alreadyCompleted) {
            (`[Tour] Tour de ${pathname} já foi completado`);
            return;
        }

        if (hasInitialized.current) {
            (`[Tour] Tour de ${pathname} já foi inicializado nesta montagem`);
            return;
        }

        hasInitialized.current = true;
        (`[Tour] Preparando para iniciar tour de ${pathname}...`);

        const timer = setTimeout(() => {
            const firstStep = pageTours[pathname][0];
            const firstElementSelector = typeof firstStep.element === 'string'
                ? firstStep.element
                : '#unknown';
            const firstElement = document.querySelector(firstElementSelector);

            (`[Tour] Procurando ${firstElementSelector}:`, firstElement);

            if (firstElement) {
                (`[Tour] Elemento encontrado! Iniciando tour de ${pathname}...`);
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

    useEffect(() => {
        return () => {
            cleanupDriver();
        };
    }, []);

    const resetTour = (pathname?: string) => {
        if (pathname) {
            const completed = getCompletedPages();
            const filtered = completed.filter(p => p !== pathname);
            localStorage.setItem(TOUR_COMPLETED_PAGES_KEY, JSON.stringify(filtered));
            (`[Tour] Tour de ${pathname} resetado!`);
        } else {
            localStorage.removeItem(TOUR_COMPLETED_PAGES_KEY);
            ('[Tour] Todos os tours resetados!');
        }
        cleanupDriver();
    };

    if (typeof window !== 'undefined') {
        (window as any).resetLogiBotsTour = resetTour;
    }

    return { resetTour };
};