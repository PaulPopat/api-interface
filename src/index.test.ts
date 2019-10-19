import { IsString } from "@paulpopat/safe-type";
import GenerateInterface from "./index";

it("Has sub functions", () => {
  // Act
  const sut = GenerateInterface(
    {
      profile: {
        getBasicInformation: {
          method: "GET",
          url: "profile/basic-information",
          returns: IsString
        }
      }
    },
    {
      base: "http://localhost:8080/"
    }
  );

  // Assert
  expect(typeof sut.profile.getBasicInformation).toBe("function");
});
