import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '@/services/api';

const REPORTS_PAGE_SIZE = 100;

export const extractArray = (payload) => {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return Array.isArray(payload) ? payload : [];
};

export const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const normalizeStatus = (status) => {
  const normalized = {
    start: 'start',
    step1: '1',
    step2: '2',
    step3: '3',
    step4: '4',
    step5: '5',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
  };

  return normalized[status] || status || 'start';
};

export const getStatusLabel = (status) => {
  const normalized = normalizeStatus(status);

  return {
    start: 'Início',
    '1': 'Contrato',
    '2': 'Financeiro',
    '3': 'Aditivos',
    '4': 'Compliance',
    '5': 'Cadastrado',
  }[normalized] || normalized;
};

export const isFinishedStatus = (status) => normalizeStatus(status) === '5';

export const getApprovalStatusLabel = (status) => {
  return {
    draft: 'Rascunho',
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
  }[status] || 'Não definido';
};

export const formatCurrency = (value) => {
  return `R$ ${toNumber(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDateValue = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return format(date, 'dd/MM/yyyy');
};

const fetchAllTaos = async () => {
  let page = 1;
  let totalPages = 1;
  const taos = [];

  do {
    const response = await api.get('/taos', {
      params: { page, limit: REPORTS_PAGE_SIZE },
    });

    const payload = response.data;
    taos.push(...extractArray(payload));

    totalPages = Math.max(payload?.meta?.pages || 1, 1);
    page += 1;
  } while (page <= totalPages);

  return taos;
};

export function useReportTaos() {
  return useQuery({
    queryKey: ['reports', 'taos'],
    queryFn: fetchAllTaos,
    placeholderData: [],
  });
}

export function useReportResourceList(resourceName) {
  return useQuery({
    queryKey: ['reports', resourceName],
    queryFn: async () => {
      const response = await api.get(`/resources/${resourceName}`);
      return extractArray(response.data);
    },
    placeholderData: [],
  });
}

export function useReportTaoDetail(taoId) {
  return useQuery({
    queryKey: ['reports', 'tao-detail', taoId],
    queryFn: async () => {
      const response = await api.get(`/taos/${taoId}`);
      return response.data;
    },
    enabled: !!taoId,
  });
}
