package com.asturias2026.costume.dto;

import java.util.List;

public record BallsViewResponse(
        String myBallColor,
        List<BallPair> pairs) {

    public record BallPair(List<String> ballColors) {}
}
