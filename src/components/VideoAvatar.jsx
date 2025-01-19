import { avatars, useTalkingAvatar } from "@/hooks/useTalkingAvatar";
import { Html, useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { MathUtils, MeshStandardMaterial } from "three";
import { randInt } from "three/src/math/MathUtils";

const ANIMATION_FADE_TIME = 0.5;

export function TalkingAvatar({ avatar, visemes, videoRef, ...props }) {
    const group = useRef();
    const { scene } = useGLTF(`/models/Teacher_${avatar}.glb`);
    useEffect(() => {
        scene.traverse((child) => {
            if (child.material) {
                child.material = new MeshStandardMaterial({
                    map: child.material.map,
                });
            }
        });
    }, [scene]);

    const isVideoPlaying = useTalkingAvatar((state) => state.isVideoPlaying);
    const { animations } = useGLTF(`/models/animations_${avatar}.glb`);
    const { actions, mixer } = useAnimations(animations, group);
    const [animation, setAnimation] = useState("Idle");
    const [blink, setBlink] = useState(false);

    useEffect(() => {
        console.log(isVideoPlaying);
    }, [isVideoPlaying]);

    useEffect(() => {
        let blinkTimeout;
        const nextBlink = () => {
            blinkTimeout = setTimeout(() => {
                setBlink(true);
                setTimeout(() => {
                    setBlink(false);
                    nextBlink();
                }, 100);
            }, randInt(1000, 5000));
        };
        nextBlink();
        return () => clearTimeout(blinkTimeout);
    }, []);

    useEffect(() => {
        let interval;

        // Function to select a random animation
        const getRandomAnimation = () => {
            const animations = ["Talking", "Talking2"];
            return animations[Math.floor(Math.random() * animations.length)];
        };

        if (isVideoPlaying) {
            setAnimation("Talking");
            // Start interval to change animation
            interval = setInterval(() => {
                setAnimation(getRandomAnimation());
            }, 3000);
        } else {
            setAnimation("Idle");
        }
        return () => clearInterval(interval);
    }, [isVideoPlaying]);

    useFrame(() => {
        const { isVideoPlaying } = useTalkingAvatar.getState();

        // console.log(isVideoPlaying);

        if (isVideoPlaying && visemes) {
            // Reset morph targets
            for (let i = 0; i <= 21; i++) {
                lerpMorphTarget(i, 0, 0.1);
            }

            // Map visemes to current video time
            const currentTime = videoRef.current?.currentTime * 1000; // Convert to milliseconds
            for (let i = visemes.length - 1; i >= 0; i--) {
                const viseme = visemes[i];
                if (currentTime >= viseme[0]) {
                    lerpMorphTarget(viseme[1], 1, 0.2); // Adjust the target based on the viseme data
                    break;
                }
            }
        } else {
            // Idle state: Reset morph targets
            for (let i = 0; i <= 21; i++) {
                lerpMorphTarget(i, 0, 0.1);
            }
        }
    });

    useEffect(() => {
        actions[animation]
            ?.reset()
            .fadeIn(mixer.time > 0 ? ANIMATION_FADE_TIME : 0)
            .play();
        return () => {
            actions[animation]?.fadeOut(ANIMATION_FADE_TIME);
        };
    }, [animation, actions]);

    const lerpMorphTarget = (target, value, speed = 0.1) => {
        scene.traverse((child) => {
            if (child.isSkinnedMesh && child.morphTargetDictionary) {
                const index = child.morphTargetDictionary[target];
                if (
                    index === undefined ||
                    child.morphTargetInfluences[index] === undefined
                ) {
                    return;
                }
                child.morphTargetInfluences[index] = MathUtils.lerp(
                    child.morphTargetInfluences[index],
                    value,
                    speed
                );
            }
        });
    };

    return (
        <group {...props} dispose={null} ref={group}>
            <primitive object={scene} />
        </group>
    );
}

avatars.forEach((avatar) => {
    useGLTF.preload(`/models/Teacher_${avatar}.glb`);
    useGLTF.preload(`/models/animations_${avatar}.glb`);
});
