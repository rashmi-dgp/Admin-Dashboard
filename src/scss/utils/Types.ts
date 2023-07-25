// import { genericPokemonType } from "../../utils/types";

export interface AppTypeInitialState{}
export interface PokemonInitialStateType{
    allPokemon: undefined | genericPokemonType[];
}
export interface genericPokemonType{
    name: string;
    url:  string;
}