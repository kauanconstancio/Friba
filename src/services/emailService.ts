export interface InviteEmailParams {
  toEmail: string;
  toName?: string;
  role: string;
  inviteCode: string;
  inviteLink: string;
  invitedByName: string;
  teamName?: string;
}

export function generateInviteEmailContent(params: InviteEmailParams) {
  const team = params.teamName || 'Friba Esports';
  const roleName = params.role || 'Jogador';
  const nameGreeting = params.toName ? `Olá, ${params.toName}!` : 'Olá!';

  const subject = `Convite Oficial - Faça parte da ${team} (${roleName})`;

  const bodyText = `${nameGreeting}

Você foi oficialmente convidado(a) por ${params.invitedByName} para integrar a lineup da ${team} como ${roleName}!

Para concluir seu ingresso no elenco oficial, acesse o link de pré-cadastro abaixo:
${params.inviteLink}

Código do Convite: ${params.inviteCode}

No pré-cadastro, você irá registrar:
- Seu Nome Completo
- Seu Nick in-game (Pokémon Unite)
- Seu ID de Jogador no Pokémon Unite
- Sua Função no jogo (Attacker, Speedster, All-Rounder, Defender ou Supporter)
- Seus 3 Pokémon preferidos
- Sua Senha de acesso ao sistema

Nos vemos no campo de batalha!
Atenciosamente,
Comissão Técnica · ${team}`;

  return {
    subject,
    bodyText,
  };
}

export function openNativeEmailClient(params: InviteEmailParams): void {
  const { subject, bodyText } = generateInviteEmailContent(params);
  const mailtoUrl = `mailto:${encodeURIComponent(params.toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  window.open(mailtoUrl, '_blank');
}
