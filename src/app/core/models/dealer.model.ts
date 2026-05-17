export interface Dealer {
  id: number;
  name: string;
  phone: string;
  address: string;
  createdAt?: string;
}

export interface DealerRequest {
  name: string;
  phone: string;
  address: string;
  username: string;
  password: string;
}
