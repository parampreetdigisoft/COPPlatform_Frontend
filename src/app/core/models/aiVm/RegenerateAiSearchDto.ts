export class RegenerateAiSearchDto {
  cityID!: number;
  cityEnable = false;
  pillarEnable = false;
  questionEnable = false;
  viewerUserIDs: number[] = [];
}
export class RegeneratePilalrAiSearchDto  extends RegenerateAiSearchDto{
  pillarID!: number;
}
