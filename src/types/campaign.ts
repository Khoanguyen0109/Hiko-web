export interface PublicWheelSlot {
  label: string;
  color: string;
}

export interface PublicCampaign {
  name: string;
  description: string;
  wheelSlots: PublicWheelSlot[];
}

export interface PlayResultWin {
  result: 'win';
  reward: {
    label: string;
    type: 'percentage_discount' | 'free_product';
    discountPercent?: number;
    freeDish?: string;
  };
  voucher: {
    code: string;
    qrToken: string;
    expiresAt: string | null;
  };
  playsRemaining: number;
}

export interface PlayResultLose {
  result: 'lose';
  message: string;
  playsRemaining: number;
}

export interface PlayResultNoPlaysRemaining {
  result: 'no_plays_remaining';
  message: string;
}

export type PlayResult =
  | PlayResultWin
  | PlayResultLose
  | PlayResultNoPlaysRemaining;

export interface LookupResultActive {
  status: 'active';
  reward: {
    label: string;
    type: 'percentage_discount' | 'free_product';
    discountPercent?: number;
    freeDish?: string;
  };
  voucher: {
    code: string;
    qrToken: string;
    expiresAt: string | null;
  };
}

export interface LookupResultRedeemed {
  status: 'redeemed';
  message: string;
  redeemedAt: string;
}

export interface LookupResultExpired {
  status: 'expired';
  message: string;
}

export interface LookupResultNone {
  status: 'none';
  message: string;
}

export type LookupResult =
  | LookupResultActive
  | LookupResultRedeemed
  | LookupResultExpired
  | LookupResultNone;

export interface WheelDisplaySlot {
  label: string;
  color: string;
  sub?: string;
  main?: string;
  single?: string;
  icon: string;
  textColor: string;
  bg: string;
  stroke?: string;
}
