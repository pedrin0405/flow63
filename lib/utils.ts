import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para transformar centavos em string formatada (Ex: 1000 -> "10,00")
const formatToBRL = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Função para converter a string formatada de volta para número decimal
const parseBRLToNumber = (value: string) => {
  return Number(value.replace(/\D/g, "")) / 100;
};
