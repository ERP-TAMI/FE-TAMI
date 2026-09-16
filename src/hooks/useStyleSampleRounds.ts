import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { styleSampleRoundsApi } from "@/api/style-sample-rounds.api";
import type {
  CreateStyleSampleRoundInput,
  UpdateStyleSampleRoundInput,
} from "@/types/style-sample-round";

export const styleSampleRoundKeys = {
  all: (styleId: string) => ["style-sample-rounds", styleId] as const,
};

export function useStyleSampleRounds(styleId?: string) {
  return useQuery({
    queryKey: styleSampleRoundKeys.all(styleId ?? ""),
    queryFn: () => styleSampleRoundsApi.list(styleId as string),
    enabled: Boolean(styleId),
  });
}

export function useCreateStyleSampleRound(styleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStyleSampleRoundInput) =>
      styleSampleRoundsApi.create(styleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleSampleRoundKeys.all(styleId) });
    },
  });
}

export function useUpdateStyleSampleRound(styleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roundId,
      input,
    }: {
      roundId: string;
      input: UpdateStyleSampleRoundInput;
    }) => styleSampleRoundsApi.update(styleId, roundId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleSampleRoundKeys.all(styleId) });
    },
  });
}

export function useUploadStyleSampleImage(styleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roundId, file }: { roundId: string; file: File }) => {
      const presign = await styleSampleRoundsApi.presignImage(styleId, roundId, file);
      await styleSampleRoundsApi.uploadToS3(presign.uploadUrl, file);
      return styleSampleRoundsApi.confirmImage(styleId, roundId, {
        objectKey: presign.objectKey,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleSampleRoundKeys.all(styleId) });
    },
  });
}

export function useRemoveStyleSampleImage(styleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roundId, imageId }: { roundId: string; imageId: string }) =>
      styleSampleRoundsApi.removeImage(styleId, roundId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleSampleRoundKeys.all(styleId) });
    },
  });
}
