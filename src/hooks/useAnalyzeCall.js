import { useMutation } from '@tanstack/react-query'
import { analyzeCall } from '../api/calls.js'

export function useAnalyzeCall() {
    return useMutation({
        mutationKey: ['calls', 'analyze'],
        mutationFn: analyzeCall,
    })
}
